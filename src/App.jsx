import { PDFUpload } from './components'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-end items-center py-6'>
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
        {/* PDF Upload Component */}
        <PDFUpload />
      </main>
    </div>
  )
}

export default App
