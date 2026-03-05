const response = await fetch('http://localhost:3000/api/v1/webhooks/users/insert', {
  method: 'POST',
  body: JSON.stringify({
    record: {
      id: '2ff0f427-6279-4194-9c6b-0d4b97d89535',
      email: 'fabien+01131804@quantedsquare.com'
    }
  }),
  headers: {
    'Content-Type': 'content/json',
    authorization: 'Bearer 1b6d37ddd7edc26729cbcf77ef0141818ed32fecd8dc5343f477f586fa709585'
  }
})

console.log(response)
