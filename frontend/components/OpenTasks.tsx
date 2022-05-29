import React from 'react'
import { ethers } from 'ethers'
import { useData } from '../contexts/dataContext'
import { Status } from '../types'
import Link from 'next/link'

export const OpenTasks = () => {
  const { state } = useData()
  const { NEW } = state

  if (!NEW || NEW.length === 0) {
    return <div>No ew tasks available!</div>
  }

  return (
    <div className="w-1/2">
      <h3 className="text-xl mb-4 font-bold flex">New tasks</h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {NEW.map((t, i) => {
            return <TaskItem key={i} taskId={t} />
          })}
        </ul>
      </div>
    </div>
  )
}

const TaskItem = ({ taskId }) => {
  const { state } = useData()
  const { tasks } = state
  const task = tasks[taskId]
  return (
    <li>
      <Link href={`/tasks/${task.id}`}>
        <a className="block hover:bg-gray-50">
          <div className="flex items-center px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1 flex items-center">
              <div className="flex-shrink-0">
                <TaskIcon status={task.status} />
              </div>
              <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                <div>
                  <p className="text-sm font-medium text-purple-600 truncate flex">
                    {task.name}
                  </p>
                  <p className="mt-2 flex items-center text-sm text-gray-500">
                    <svg
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="truncate">{task.owner}</span>
                  </p>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900 flex">Reward</p>
                    <p className="mt-2 flex items-center text-sm text-gray-500">
                      {ethers.utils.formatEther(task.reward)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </a>
      </Link>
    </li>
  )
}

const TaskIcon = ({ status }) => {
  if (status === Status.NEW) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }

  return null
}
