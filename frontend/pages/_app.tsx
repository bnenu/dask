import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ContractProvider } from '../contexts/contractContext'
import { AccountProvider } from '../contexts/accountContext'
import { DataProvider } from '../contexts/DataProvider'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ContractProvider>
      <AccountProvider>
        <Component {...pageProps} />
      </AccountProvider>
    </ContractProvider>
  )
}

export default MyApp
