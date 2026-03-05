export const ERROR_TYPES = {
  UNAUTHORIZED: {
    statusCode: 401,
    message: 'Unauthorized access'
  },
  INVALID_INPUT: {
    statusCode: 400,
    message: 'Invalid or missing required fields in request'
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    message: 'An unexpected error occurred while processing the request'
  },
  ENQUEUING_FAILED: {
    statusCode: 503,
    message: 'Failed to enqueue bid for processing'
  },
  NOT_FOUND: {
    type: 'NOT_FOUND',
    statusCode: 404,
    defaultMessage: 'Resource not found'
  },
  DATABASE_ERROR: {
    type: 'DATABASE_ERROR',
    statusCode: 500,
    defaultMessage: 'Database error occurred'
  },
  TECHNICAL_ERROR: {
    type: 'TECHNICAL_ERROR',
    statusCode: 500,
    defaultMessage: 'Technical error occurred'
  },
  AUCTION_CLOSED: {
    statusCode: 422,
    message: 'Cannot place bid on closed auction'
  },
  NOT_IMPLEMENTED: {
    statusCode: 501,
    message: 'Japanese auction type not implemented yet'
  },
  INVALID_AUCTION_TYPE: {
    statusCode: 422,
    message: 'Invalid auction type. Neither Reverse nor Dutch'
  },
  BID_PROCESSING_FAILED: {
    statusCode: 400,
    message: 'Failed to process bid'
  },
  INVALID_TASK_TYPE: {
    statusCode: 400,
    message: 'Invalid task type provided'
  },
  INVALID_BID_TIME: {
    statusCode: 422,
    message: 'Bid cannot be placed outside of valid round time window'
  },
  INVALID_BID_PRICE: {
    statusCode: 422,
    message: 'Bid price does not match current round price'
  },
  INVALID_BID_DECREMENT: {
    statusCode: 422,
    message: 'Invalid price decrement between consecutive bids'
  }
}
