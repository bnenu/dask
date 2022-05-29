import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Header } from '../components/Header'
import { MyTasks } from '../components/MyTasks'
import { OpenTasks } from '../components/OpenTasks'
import { TasksFeed } from '../components/TasksFeed'

const Home: NextPage = () => {
  return (
    <div className="flex w-full flex-1 py-8 justify-between">
      <TasksFeed />
      <div className="">
        <div className="mb-4">
          <OpenTasks />
        </div>
        <div>
          <MyTasks />
        </div>
      </div>
    </div>
  )
}

export default Home
