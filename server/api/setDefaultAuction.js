import fs from 'fs'
// This endpoint is used to create json files for default auctions through the builder page.
// The file will be saved in the root directory of the project and need to be moved to the correct folder.
// (/scripts/defaultAuctions/test)
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const fileName = `${body.type}-defaultAuction.json`
    fs.writeFileSync(fileName, JSON.stringify(body, null, 2))

    return { success: true }
  } catch (error) {
    console.error('Error in setDefaultAuction:', error)
    return { success: false, error: error.message }
  }
})
