
import './App.css'
import { Toaster } from 'react-hot-toast'
import PatientPage from './Patient'

function App() {

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <PatientPage />
    </>
  )
}

export default App
