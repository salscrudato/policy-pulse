import { useState } from 'react'
import { APP_NAME } from './constants'
import { PDFUpload } from './components'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1)
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <h1 className='text-3xl font-bold text-gray-900'>{APP_NAME}</h1>
            <div className='flex space-x-4'>
              <a
                href='https://vite.dev'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform hover:scale-110'
              >
                <img src={viteLogo} className='logo h-8 w-8' alt='Vite logo' />
              </a>
              <a
                href='https://react.dev'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform hover:scale-110'
              >
                <img
                  src={reactLogo}
                  className='logo react h-8 w-8'
                  alt='React logo'
                />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold text-gray-900 mb-4'>
            Welcome to {APP_NAME}
          </h2>
          <p className='text-lg text-gray-600 mb-8'>
            Upload and extract text from PDF documents with ease
          </p>
        </div>

        {/* PDF Upload Component */}
        <PDFUpload />

        {/* Demo Counter Section */}
        <div className='mt-16 text-center'>
          <div className='bg-white rounded-lg shadow-md p-8 max-w-md mx-auto'>
            <h3 className='text-xl font-semibold text-gray-900 mb-4'>
              Demo Counter
            </h3>
            <button
              onClick={handleIncrement}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              Count is {count}
            </button>
            <p className='mt-4 text-gray-600'>
              Edit{' '}
              <code className='bg-gray-100 px-2 py-1 rounded text-sm'>
                src/App.jsx
              </code>{' '}
              and save to test HMR
            </p>
          </div>

          <p className='mt-8 text-gray-500'>
            Click on the Vite and React logos to learn more
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
