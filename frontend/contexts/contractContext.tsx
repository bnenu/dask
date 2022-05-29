import React, { createContext, useContext } from 'react'
import { ethers, providers } from 'ethers'
import ContractArtifact from '../contracts/Dask.json'

import contractAddress from '../contracts/contract-address.json'

type Contract = Record<string, any> | null
export type ContractContextValue = {
  contract: Contract
  provider: providers.Provider | null
}

export type ContractProviderProps = {
  children: React.ReactNode
}

export const ContractContext = createContext<ContractContextValue>({
  contract: null,
  provider: null,
})

export const ContractProvider = ({ children }: ContractProviderProps) => {
  const provider = getProvider()
  const contract = new ethers.Contract(
    contractAddress.Dask,
    ContractArtifact.abi,
    provider
  )

  return (
    <ContractContext.Provider value={{ contract, provider }}>
      {children}
    </ContractContext.Provider>
  )
}

export function useContract() {
  return useContext(ContractContext)
}

const getProvider = () => {
  let provider

  console.info(`Deploy env ${process.env.NEXT_PUBLIC_ENVIRONMENT}`)

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'rinkeby') {
    provider = new ethers.providers.InfuraProvider(
      'rinkeby',
      process.env.REACT_APP_INFURA_API_KEY
    )
  } else if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'mumbai') {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MUMBAI
    )
  } else if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'polygon') {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_POLYGON
    )
  } else {
    provider = new ethers.providers.JsonRpcProvider()
  }

  return provider
}
