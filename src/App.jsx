import { PDFUpload } from './components'
import './App.css'

function App() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* PDF Upload Component */}
        <PDFUpload />
      </main>
    </div>
  )
}

export default App
