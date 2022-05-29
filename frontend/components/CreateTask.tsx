import React, { useState } from 'react'
import { create } from 'ipfs-http-client'
import { useData } from '../contexts/dataContext'

// @ts-ignore
const client = create('https://ipfs.infura.io:5001/api/v0')

const initialState = { name: '', description: '', amount: '0' }

type TaskForm = {
  name: string
  description: string
  amount: string
}

export const CreateTask = () => {
  const { createTask } = useData()
  const [form, setForm] = useState<TaskForm>(initialState)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const toggleCreateTask = () => {
    setShowCreate(!showCreate)
  }

  const change = (k: string) => (event: any) => {
    setForm((f) => ({
      ...f,
      [k]: event.target.value,
    }))
  }

  const handleSave = async () => {
    console.log({ form })

    const hash = await savePostToIpfs(form)

    setSubmitting(true)
    // @ts-ignore
    await createTask(form.name, hash, form.amount)
    setSubmitting(false)
    toggleCreateTask()
  }

  const savePostToIpfs = async (form: TaskForm) => {
    /* save post metadata to ipfs */
    try {
      const added = await client.add(JSON.stringify(form))
      console.log({ added  })
      return added.path
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <button
        onClick={toggleCreateTask}
        disabled={false}
        className="inline-block bg-purple-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
      >
        Create task
      </button>
      <div
        className="relative z-10"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        {/*
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
          */}
        {showCreate && (
          <>
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
                {/*
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        */}
                <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
                  <div>
                    <div className="bg-transparent py-5 border-b border-purple-200 ">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Create task
                      </h3>
                    </div>

                    <div className="pt-4">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          onChange={change('name')}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                          placeholder=""
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          rows={4}
                          name="description"
                          id="description"
                          onChange={change('description')}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                        ></textarea>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Reward
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="amount"
                          id="amount"
                          onChange={change('amount')}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex">
                    <button
                      type="button"
                      onClick={toggleCreateTask}
                      className="
inline-flex items-center px-4 py-2 border border-purple-300 shadow-sm text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={submitting}
                      className="ml-2 inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                    >
                      {submitting ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
