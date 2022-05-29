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
import {
  EventTypes,
  EventName,
  Status,
  mapStatusToKey,
  StatusValue,
} from '../types'

export type DataProviderProps = {
  children: React.ReactNode
}

export type State = {
  myTasks: []
  feed: []
  tasks: {}
  NEW: []
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

const prop = (k: string) => (obj: Record<string, any>) => obj[k]

const reducer = (state: State, action: StateAction) => {
  switch (action.type) {
    case 'RECEIVED_MY_TASKS':
      return {
        ...state,
        myTasks: action.payload.map(prop('id')),
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
    case 'CLEAR_FEED':
    return {
      ...state,
      feed: []
    }
    case 'TASKS_BY_STATUS':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          ...normalizeById(action.payload.tasks),
        },
        [mapStatusToKey[action.payload.status as StatusValue]]:
          action.payload.tasks.map(prop('id')),
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

  // load open tasks
  useEffect(() => {
    const init = async () => {
      await fetchTasksByStatus(Status.NEW)
    }

    init()
  }, [contract])

  // subscribe to tasks feed
  useEffect(() => {
    // @ts-ignore
    dispatch({ type: 'CLEAR_FEED'})
    contract?.on('TaskCreated', taskHandler)
    contract?.on('TaskAssigned', taskHandler)
    contract?.on('TaskCancelled', taskHandler)
    contract?.on('TaskCompleted', taskHandler)
    //
    return () => {
      contract?.removeAllListeners()
    }
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

  const fetchTaskById = useCallback(
    async (id) => {
      let task
      try {
        task = await contract?.fetchTaskById(id)
      } catch (err) {
        console.error(err)
      }

      return task
    },
    [contract]
  )

  const fetchTasksByStatus = useCallback(
    async (status) => {
      const allIds = await contract?.fetchTaskIds()
      let byStatus = []

      for (let i = 0; i <= allIds.length; i++) {
        const t = await fetchTaskById(allIds[i])
        if (t && t.status === status) {
          byStatus.push(t)
        }
      }
      // @ts-ignore
      dispatch({
        type: 'TASKS_BY_STATUS',
        payload: { status, tasks: byStatus },
      })
    },
    [contract]
  )

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
