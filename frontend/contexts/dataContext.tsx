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
import { EventTypes, EventName } from '../types'

export type DataProviderProps = {
  children: React.ReactNode
}

export type State = {
  myTasks: []
  feed: []
  tasks: {}
}

export type StateAction = {
  type: string
  payload?: any
}

export type DataContextValue = {
  createTask: (arg0: string, arg1: string, arg3: string) => void
  assignTask: (taskId: any, address: string) => void
  cancelTask: (taskId: any) => void
  completeTask: (taskId: any) => void
  recallReward: (taskId: any) => void
  takeReward: (taskId: any) => void
  raiseClaim: (taskId: any, amount: any) => void
  fetchMyTasks: () => void
  state: State
}

export const DataContext = createContext<DataContextValue>(
  {} as DataContextValue
)

const initialState = {
  myTasks: [],
  feed: [],
  tasks: {},
}

const normalizeById = (xs) =>
  xs.reduce((acc, next) => {
    return {
      ...acc,
      [next.id]: next,
    }
  }, {})

const reducer = (state: State, action: StateAction) => {
  switch (action.type) {
    case 'RECEIVED_MY_TASKS':
      return {
        ...state,
        myTasks: action.payload.map((x) => x.id),
        tasks: {
          ...state.tasks,
          ...normalizeById(action.payload),
        },
      }
    case 'INCOMING_EVENT':
      return {
        ...state,
        feed: [action.payload].concat(state.feed),
        tasks: {
          ...state.tasks,
          [action.payload.id]: action.payload,
        },
      }
    default:
      throw new Error()
  }
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const { contract } = useContract()
  const { account, accountProvider } = useAccount()
  const [contractWithSigner, setContractWithSigner] = useState<any>(null)
  // @ts-ignore
  const [state, dispatch] = useReducer(reducer, initialState)

  // load contract and provider
  useEffect(() => {
    if (contract && accountProvider) {
      const signer = accountProvider?.getSigner()
      const contractWithSigner = contract?.connect(signer)
      setContractWithSigner(contractWithSigner)
    }
  }, [contract, accountProvider])

  // load my tasks initially
  useEffect(() => {
    fetchMyTasks()
  }, [account])

  // subscribe to tasks feed
  useEffect(() => {
    contract?.on('TaskCreated', taskHandler)
    contract?.on('TaskAssigned', taskHandler)
    contract?.on('TaskCancelled', taskHandler)
    contract?.on('TaskCompleted', taskHandler)
    // console.log('listeners ', contract?.listenerCount())
  }, [contract])

  const taskHandler = useCallback(
    (
      taskId: string,
      name: string,
      description: string,
      reward: any,
      status: number,
      owner: string,
      assignee: string,
      createdAt: any,
      completedAt: any,
      paid: boolean,
      event: any
    ) => {
      console.log({ event })
      const task = {
        id: taskId,
        name,
        description,
        reward,
        status,
        owner,
        assignee,
        createdAt,
        completedAt,
        paid,
      }
      // @ts-ignore
      dispatch({
        type: 'INCOMING_EVENT',
        payload: { event: EventTypes[event.event as EventName], task },
      })
    },
    [dispatch]
  )

  const createTask = useCallback(
    async (name: string, hash: string, amount: string): Promise<void> => {
      const opts = { value: ethers.utils.parseEther(amount) }
      try {
        await contractWithSigner?.createTask(name, hash, opts)
        await fetchMyTasks()
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const assignTask = useCallback(
    async (id, address) => {
      try {
        await contractWithSigner?.assignTask(id, address)
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const cancelTask = useCallback(
    async (id) => {
      try {
        await contractWithSigner?.cancelTask(id)
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const completeTask = useCallback(
    async (id) => {
      try {
        await contractWithSigner?.completeTask(id)
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const raiseClaim = useCallback(
    async (id, amount) => {
      try {
        await contractWithSigner?.raiseClaim(
          id,
          ethers.utils.parseEther(amount)
        )
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const recallReward = useCallback(
    async (id) => {
      try {
        await contractWithSigner?.recallReward(id)
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const takeReward = useCallback(
    async (id) => {
      try {
        await contractWithSigner?.takeReward(id)
      } catch (err) {
        console.error(err)
      }
    },
    [contractWithSigner]
  )

  const fetchMyTasks = useCallback(async () => {
    try {
      const tasks = await contract?.fetchTasksByMember(account)
      // @ts-ignore
      dispatch({ type: 'RECEIVED_MY_TASKS', payload: tasks })
    } catch (err) {
      console.error({ error: err })
    }
  }, [contract, account])

  return (
    <DataContext.Provider
      value={{
        createTask,
        assignTask,
        cancelTask,
        completeTask,
        recallReward,
        takeReward,
        raiseClaim,
        fetchMyTasks,
        state,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  return useContext(DataContext)
}
