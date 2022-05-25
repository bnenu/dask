import React from 'react'
import { useAccount } from '../contexts/accountContext'
import { Wallet } from './Wallet'

export const Header = () => {
  const { connect, account } = useAccount()

  return (
    <header className="bg-purple-600 w-full">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-purple-500 lg:border-none">
          <div className="flex items-center">
            <a href="#">
              <span className="sr-only">Dask</span>
              <img
                className="h-10 w-auto"
                src="https://tailwindui.com/img/logos/workflow-mark.svg?color=white"
                alt="Dask"
              />
            </a>
            <div className="hidden ml-10 space-x-8 lg:block">
              <a
                href="#"
                className="text-base font-medium text-white hover:text-purple-50"
              >
                Solutions
              </a>

              <a
                href="#"
                className="text-base font-medium text-white hover:text-purple-50"
              >
                Pricing
              </a>

              <a
                href="#"
                className="text-base font-medium text-white hover:text-purple-50"
              >
                Docs
              </a>

              <a
                href="#"
                className="text-base font-medium text-white hover:text-purple-50"
              >
                Company
              </a>
            </div>
          </div>
          <div className="ml-10 space-x-4">
            {!account ?
            <button
              onClick={connect}
              disabled={!connect}
              className="inline-block bg-purple-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
            >
              Connect
            </button>
              : <Wallet/>}
          </div>
        </div>
        <div className="py-4 flex flex-wrap justify-center space-x-6 lg:hidden">
          <a
            href="#"
            className="text-base font-medium text-white hover:text-purple-50"
          >
            Solutions
          </a>

          <a
            href="#"
            className="text-base font-medium text-white hover:text-purple-50"
          >
            Pricing
          </a>

          <a
            href="#"
            className="text-base font-medium text-white hover:text-purple-50"
          >
            Docs
          </a>

          <a
            href="#"
            className="text-base font-medium text-white hover:text-purple-50"
          >
            Company
          </a>
        </div>
      </nav>
    </header>
  )
}
