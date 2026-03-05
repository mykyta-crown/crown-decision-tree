import { CloudTasksClient } from '@google-cloud/tasks'
import { ExternalAccountClient } from 'google-auth-library'

// Get base URL from environment or fallback to VERCEL_URL
const getBaseUrl = () => {
  if (process.env.GCP_ENDPOINT) {
    return process.env.GCP_ENDPOINT
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  throw new Error('Neither GCP_ENDPOINT nor VERCEL_URL environment variable is set')
}

const BASE_URL = getBaseUrl()

//TODO: Rename la queue Japanese pour que le nom soit plus générique, il traite surtout l'execution des rounds et pas de bids
const CONFIG = {
  PROJECT: process.env.GCP_PROJECT_ID || 'crown-476614',
  QUEUE: {
    JAPANESE: 'JaponeseRoundHandler',
    DUTCH: 'BidWatchQueue'
  },
  LOCATION: 'europe-west1',
  URL: {
    JAPANESE: `${BASE_URL}/api/v1/japanese/round_handler`,
    DUTCH: `${BASE_URL}/api/v1/dutch/auto_bid`
  }
}

// Function to get Vercel OIDC token
// In Vercel Functions, the token is passed from the request headers (x-vercel-oidc-token)
// For local development, it falls back to VERCEL_OIDC_TOKEN env var
function getVercelOidcToken(tokenFromRequest) {
  // First, try the token passed from the request
  if (tokenFromRequest) {
    return tokenFromRequest
  }

  // Fallback to env var (for local development or build time)
  const token = process.env.VERCEL_OIDC_TOKEN
  if (!token) {
    throw new Error(
      'VERCEL_OIDC_TOKEN not found. Make sure OIDC is enabled for your Vercel project and the token is passed from the request headers.'
    )
  }
  return token
}

// Initialize authentication with Workload Identity Federation for Vercel
// Based on: https://vercel.com/docs/oidc/gcp
const getAuthClient = (oidcToken) => {
  // Check if WIF environment variables are configured
  const hasWifConfig =
    process.env.GCP_PROJECT_NUMBER &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
    process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID &&
    process.env.GCP_SERVICE_ACCOUNT_EMAIL

  if (hasWifConfig) {
    // Use Workload Identity Federation with Vercel OIDC
    const projectNumber = process.env.GCP_PROJECT_NUMBER
    const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
    const providerId = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID
    const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL

    const authClient = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
      subject_token_supplier: {
        getSubjectToken: () => getVercelOidcToken(oidcToken)
      }
    })

    return authClient
  }

  // Fallback: return null to use default credentials (for local development)
  return null
}

// Create CloudTasksClient
// Will use WIF if configured, otherwise falls back to default credentials
const createClient = (oidcToken) => {
  const authClient = getAuthClient(oidcToken)

  if (authClient) {
    return new CloudTasksClient({
      projectId: CONFIG.PROJECT,
      authClient: authClient
    })
  }

  // Fallback to default credentials
  return new CloudTasksClient({
    projectId: CONFIG.PROJECT
  })
}

async function enqueueTask(payload, scheduleTime, auctionType, oidcToken = null) {
  // Create client with OIDC token (passed from request headers in production)
  const client = createClient(oidcToken)
  // queueName
  console.log('[ENQUEUER] Creating Cloud Task', {
    project: CONFIG.PROJECT,
    location: CONFIG.LOCATION,
    queue: CONFIG.QUEUE[auctionType],
    url: CONFIG.URL[auctionType],
    scheduleTime: new Date(scheduleTime * 1000).toISOString(),
    usingWIF: !process.env.GCP_CREDENTIALS,
    timestamp: new Date().toISOString()
  })
  console.log('Creating queue path:', CONFIG.PROJECT, CONFIG.LOCATION, CONFIG.QUEUE[auctionType])
  const parent = client.queuePath(CONFIG.PROJECT, CONFIG.LOCATION, CONFIG.QUEUE[auctionType])

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: CONFIG.URL[auctionType],
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      headers: { 'Content-Type': 'application/json' }
    },
    scheduleTime: {
      seconds: scheduleTime
    }
  }

  const request = { parent, task }

  try {
    const [response] = await client.createTask(request)
    console.log(`Created task ${response.name}`)
    return {
      success: true,
      data: { taskName: response.name },
      error: null
    }
  } catch (error) {
    console.log('Failed to create task:', error)
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.ENQUEUING_FAILED,
        message: `Failed to enqueue task: ${error.message}`
      }
    }
  }
}

async function deleteTask(taskName, oidcToken = null) {
  // Create client with OIDC token (passed from request headers in production)
  const client = createClient(oidcToken)

  try {
    // taskName should be the full path, e.g. projects/PROJECT_ID/locations/LOCATION/queues/QUEUE_ID/tasks/TASK_ID
    await client.deleteTask({ name: taskName })
    console.log(`Deleted task ${taskName}`)
    return {
      success: true,
      data: { taskName },
      error: null
    }
  } catch (error) {
    console.log('Failed to delete task:', error)
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.INTERNAL_ERROR,
        message: `Failed to delete task: ${error.message}`
      }
    }
  }
}

/**
 * Delete all pending tasks for a specific auction from the Japanese queue
 * This is used when restarting an auction to prevent old scheduled rounds from executing
 */
async function deleteTasksForAuction(auctionId, queueType = 'JAPANESE', oidcToken = null) {
  const client = createClient(oidcToken)
  const queueName = CONFIG.QUEUE[queueType] // 'JaponeseRoundHandler' or 'BidWatchQueue'
  const parent = client.queuePath(CONFIG.PROJECT, CONFIG.LOCATION, queueName)

  try {
    console.log(`[ENQUEUER] Listing tasks for auction ${auctionId} in queue ${queueName}`)

    // List all tasks in the queue with FULL view to get the HTTP request body
    const [tasks] = await client.listTasks({
      parent,
      responseView: 'FULL' // Required to get the httpRequest.body
    })
    console.log(`[ENQUEUER] Found ${tasks?.length || 0} total tasks in queue ${queueName}`)

    let deletedCount = 0
    let matchedCount = 0
    for (const task of tasks) {
      try {
        // Decode the task body to check if it's for our auction
        if (task.httpRequest?.body) {
          const bodyStr = Buffer.from(task.httpRequest.body, 'base64').toString('utf8')
          const payload = JSON.parse(bodyStr)
          const taskAuctionId = payload.auction?.id

          if (taskAuctionId === auctionId) {
            matchedCount++
            await client.deleteTask({ name: task.name })
            deletedCount++
            console.log(`[ENQUEUER] Deleted task ${task.name} for auction ${auctionId}`)
          }
        }
      } catch (parseError) {
        // Skip tasks that can't be parsed
        console.log(`[ENQUEUER] Could not parse task ${task.name}:`, parseError.message)
      }
    }
    console.log(
      `[ENQUEUER] Matched ${matchedCount} tasks, deleted ${deletedCount} for auction ${auctionId}`
    )

    console.log(
      `[ENQUEUER] Deleted ${deletedCount} tasks for auction ${auctionId} from ${queueName}`
    )
    return {
      success: true,
      data: { deletedCount, auctionId },
      error: null
    }
  } catch (error) {
    console.error(`[ENQUEUER] Failed to delete tasks for auction ${auctionId}:`, error)
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.INTERNAL_ERROR,
        message: `Failed to delete tasks for auction: ${error.message}`
      }
    }
  }
}

export { enqueueTask, deleteTask, deleteTasksForAuction }
