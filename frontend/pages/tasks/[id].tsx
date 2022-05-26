import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useData } from '../../contexts/dataContext'
import { FeedStatus } from '../../components/FeedStatus'
import { Status } from '../../types'
import { useAccount } from '../../contexts/accountContext'

const Task: NextPage = () => {
  const router = useRouter()
  const { account } = useAccount()
  const { id } = router.query
  const {
    cancelTask,
    completeTask,
    assignTask,
    recallReward,
    takeReward,
    raiseClaim,
    state,
  } = useData()
  const task = state.tasks[id]
  const [assignee, setAssignee] = useState<string>('')
  const [amount, setAmount] = useState<string>('')

  const handleAssign = async () => {
    console.log({ assignee })
    if (assignee) {
      await assignTask(id, assignee)
    }
  }

  const handleCancel = async () => {
    await cancelTask(id)
  }

  const handleComplete = async () => {
    await completeTask(id)
  }
  const handleRecall = async () => {
    await recallReward(id)
  }
  const handleTakeReward = async () => {
    await takeReward(id)
  }
  const handleRaiseClaim = async () => {
    console.log({ amount })
    if(amount) {
      await raiseClaim(id, amount)
    }
  }

  return (
    <div className="w-full py-8">
      <div className="bg-white overflow-hidden shadow rounded-lg w-full">
        <div className="px-4 py-5 sm:p-6">
          <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
              <div className="ml-4 mt-2 flex items-center">
                <FeedStatus status={task.status} />
                <h3 className="text-lg leading-6 font-medium text-gray-900 ml-2">
                  {task.name}
                </h3>
              </div>
              <div className="ml-4 mt-2 flex-shrink-0 flex align-center">
                {account === task.owner && task.status === Status.NEW && (
                  <div className="mr-2">
                    <label htmlFor="assignee" className="sr-only">
                      Assignee
                    </label>
                    <input
                      onChange={(e) => setAssignee(e.target.value)}
                      type="text"
                      name="assignee"
                      id="assignee"
                      className="w-64 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                      placeholder="enter an address"
                    />
                  </div>
                )}
                {account === task.owner && task.status === Status.NEW && (
                  <>
                    <button
                      type="button"
                      onClick={handleAssign}
                      disabled={!assignee}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-8"
                    >
                      Assign
                    </button>
                    <button
                      onClick={handleCancel}
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-2"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {task.status === Status.ASSIGNED && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-2"
                  >
                    Mark Complete
                  </button>
                )}
                {account === task.owner && task.status === Status.CANCELLED && !task.paid && (
                  <button
                    type="button"
                    onClick={handleRecall}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-2"
                  >
                    Recall reward
                  </button>
                )}
                {account === task.assignee && task.status === Status.COMPLETED && (
                  <button
                    type="button"
                    onClick={handleTakeReward}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Take reward
                  </button>
                )}
                {!task.paid && (
                  <>
                    <div>
                      <label htmlFor="assignee" className="sr-only">
                        Assignee
                      </label>
                      <input
                        onChange={(e) => setAmount(e.target.value)}
                        type="text"
                        name="amount"
                        id="amount"
                        className="w-64 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                        placeholder="enter an amount"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRaiseClaim}
                      disabled={!amount}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-purple-400 bg-transparent border-purple-400 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Make a claim
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex">
              <h4>Reward</h4>
              <p>{task.reward.toString()}</p>
            </div>
            <div className="flex">
              <h4>Owner</h4>
              <p>{task.owner}</p>
            </div>
            <div className="flex">
              <h4>Assignee</h4>
              <p>{task.assignee}</p>
            </div>
            <div className="flex">
              <h4>Created at</h4>
              <p>{task.createdAt.toString()}</p>
            </div>
            <div className="flex">
              <h4>Completed at</h4>
              <p>{task.completedAt.toString()}</p>
            </div>
            <div className="flex">
              <h4>Paid</h4>
              <p>{task.paid.toString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Task
