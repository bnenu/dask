import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useReducer,
} from 'react'
import { ethers } from 'ethers'
import { useContract } from './contractContext'
import { useAccount } from './accountContext'

export type DataProviderProps = {
  children: React.ReactNode
}

export type State = {
  myTasks: []
}

export type StateAction = {
  type: string
  payload?: any
}

export type DataContextValue = {
  createTask: (arg0: string, arg1: string, arg2: Date, arg3: string) => void;
  fetchMyTasks: () => void,
  state: State
}

export const DataContext = createContext<DataContextValue>(
  {} as DataContextValue
)

const initialState = {
  myTasks: [],
}

const reducer = (state: State, action: StateAction) => {
  switch (action.type) {
    case 'RECEIVED_MY_TASKS':
      return { ...state, myTasks: action.payload }
    default:
      throw new Error()
  }
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const { contract } = useContract()
  const { account, accountProvider } = useAccount()
  const [contractWithSigner, setContractWithSigner] = useState<any>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (contract && accountProvider) {
      const signer = accountProvider?.getSigner()
      const contractWithSigner = contract?.connect(signer)
    }
  }, [contract, accountProvider])

  const createTask = useCallback(
    async (name: string, hash: string, until: Date, amount: string) => {
      const time = until.getTime()
      const dateInUnixTimestamp = time / 1000
      const opts = { value: ethers.utils.parseEther(amount) }

      try {
        await contractWithSigner?.createTask(
          name,
          hash,
          dateInUnixTimestamp,
          opts
        )
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const fetchMyTasks = useCallback(async () => {
    try {
      const tasks = await contractWithSigner?.fetchTasksByMember(account)
      dispatch({ type: 'RECEIVED_MY_TASKS', payload: tasks })
    } catch (err) {
      console.error(err)
    }
  }, [])

  return (
    <DataContext.Provider value={{ createTask, fetchMyTasks, state }}>
      {children}
    </DataContext.Provider>
  )
}
