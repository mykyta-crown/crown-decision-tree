async function engineCall() {
  console.log('Engine called for auction')

  try {
    const response = await fetch('http://localhost:3000/api/engine', {
      method: 'POST',
      body: JSON.stringify({ id: 'a6ffc8e7-51bf-4520-942c-217499a40709' }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

engineCall()
