import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ContractProvider } from '../contexts/contractContext'
import { AccountProvider } from '../contexts/accountContext'
import { DataProvider } from '../contexts/dataContext'
import Head from 'next/head'
import { Header } from '../components/Header'

function MyApp(props: AppProps) {
  return (
    <ContractProvider>
      <AccountProvider>
        <DataProvider>
          <UI {...props} />
        </DataProvider>
      </AccountProvider>
    </ContractProvider>
  )
}

const UI = ({ Component, pageProps }: AppProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>Dask</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className="flex w-full flex-1 flex-col items-center px-4 text-center">
        <div className="max-w-7xl flex w-full ">
          <Component {...pageProps} />
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a
          className="flex items-center justify-center gap-2 text-xs"
          href="https://bogdannenu.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Bogdan Nenu
        </a>
      </footer>
    </div>
  )
}

export default MyApp
