
import './App.css'
import { Toaster } from 'react-hot-toast'
import Users from './User'

function App() {

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Users />
    </>
  )
}

export default App
