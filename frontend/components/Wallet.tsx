import { Account, useAccount } from 'contexts/accountContext'

export const Wallet = () => {
  const { account } = useAccount()

  const copy = (text: Account | undefined) => async () => {
    if (text) {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="w-24">
      <p
        className="text-white truncate overflow-hidden"
        onClick={copy(account)}
      >
        {account}
      </p>
    </div>
  )
}
