import React from 'react'
import { useData } from '../contexts/dataContext'
import { Status } from '../types'
import { capitalize } from '../utils/strings'
import { FeedStatus  } from './FeedStatus'

export const TasksFeed = () => {
  const { state } = useData()

  return (
    <div>
      <h3 className="text-xl font-bold mb-4 flex">Tasks feed</h3>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {state.feed.map((entry, i) => {
            return <FeedItem key={i} item={entry} />
          })}
        </ul>
      </div>
    </div>
  )
}

const FeedItem = ({ item }) => {
  const { event, task } = item

  return (
    <li>
      <div className="relative pb-8">
        <span
          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
          aria-hidden="true"
        ></span>
        <div className="relative flex space-x-3">
          <FeedStatus status={task.status} />
          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
            <div>
              <p className="text-sm text-gray-500">
                {`${capitalize(event)}`}
                <span className="font-bold">{` ${task.name}`}</span>
              </p>
            </div>
            <div className="text-right text-sm whitespace-nowrap text-gray-500">
              <p>{task.createdAt.toString()}</p>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

const FeedItemIcon = ({ status }) => {
  if (status === Status.NEW) {
    return (
      <div>
        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="white"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      </div>
    )
  }
  if (status === Status.ASSIGNED) {
    return (
      <div>
        <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="white"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    )
  }
  if (status === Status.COMPLETED) {
    return (
      <div>
        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
          {/*<!-- Heroicon name: solid/check -->*/}
          <svg
            className="h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    )
  }
  if (status === Status.CANCELLED) {
    return (
      <div>
        <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="white"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    )
  }
  return (
    <div>
      <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
        {/* Heroicon name: solid/user */}
        <svg
          className="h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  )
}
