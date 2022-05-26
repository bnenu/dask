import { expect, should } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Dask, Dask__factory } from '../typechain'
import { notDeepStrictEqual } from "assert";

const Status = {
  NEW: 0,
  ASSIGNED: 1,
  STARTED: 2,
  CANCELLED: 3,
  SUSPENDED: 4,
  COMPLETED: 5
}

const ClaimResolution = {
  OPEN: 0,
  APPROVED: 1,
  DENIED: 2,
  DISPUTE: 3
}

describe("Dask", async () => {
  let admin: SignerWithAddress;
  let member1: SignerWithAddress;
  let member2: SignerWithAddress;
  let member3: SignerWithAddress;
  let member4: SignerWithAddress;
  let member5: SignerWithAddress;
  let contract: Dask;
  let feePercent = 1;
  let feeBase = 100

  const defaultReward = ethers.utils.parseEther("1000");
  const defaultHash = "1234hashstringrandom"

  beforeEach(async () => {
    [admin, member1, member2, member3, member4, member5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Dask");
    contract = await Factory.deploy(feePercent, feeBase);
  })

  // constructor
  it("Should deploy correctly", async function () {
    expect(await contract.admin()).to.equal(admin.address);
    expect(await contract.feePercent()).to.equal(1);
    expect(await contract.feeBase()).to.equal(100);
  });

  // createTask
  it("should create a task", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    // const task = await contract.fetchTaskById(taskId);

    expect(tasks.length).to.equal(1);
    expect(task.owner).to.equal(member1.address);
    expect(task.name).to.equal("Get apples")
    expect(task.description).to.equal(defaultHash)
    expect(task.reward).to.equal(defaultReward)
    expect(task.status).to.equal(Status.NEW)
  })

  it("should not create tasks with zero reward", async () => {
  await expect(
    contract.connect(member1)
    .createTask("Get apples", defaultHash))
    .to.be.revertedWith("reward can't be zero")
  })

  it("should not create when contract is paused", async () => {
    await contract.connect(admin).pauseContract();

    await expect(
      contract.connect(member1)
      .createTask("Get apples", defaultHash))
      .to.be.revertedWith("Pausable: paused")
  })

  // assignTask
  it("should assign a task", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]

    expect(task.assignee).to.equal("0x0000000000000000000000000000000000000000")

    await contract.connect(member1).assignTask(task.id, member2.address);

    const tasksAfter = await contract.fetchTasksByMember(member1.address)
    const taskAfter = tasksAfter[0]

    expect(taskAfter.assignee).to.equal(member2.address)
  })

  it("should not assign if is not called by owner", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]

    await expect(contract.connect(member2).assignTask(task.id, member2.address))
    .to.be.revertedWith("only task owner")
  })

  it("should not assign if already started", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]

    expect(task.assignee).to.equal("0x0000000000000000000000000000000000000000")

    await contract.connect(member1).assignTask(task.id, member2.address)

    await expect(contract.connect(member1).assignTask(task.id, member2.address))
    .to.be.revertedWith("only new tasks")
  })

  it("should not assign if paused", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    await contract.connect(admin).pauseContract();

    await expect(contract.connect(member1).assignTask(task.id, member2.address))
    .to.be.revertedWith("Pausable: paused")
  })

  // cancelTask
  it("should cancel task", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    await contract.connect(member1).cancelTask(task.id)

    const tasksAfter = await contract.fetchTasksByMember(member1.address)
    const taskAfter = tasksAfter[0]

    expect(taskAfter.status).to.equal(Status.CANCELLED);
  })

  it("should not cancel if not called by owner", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    await expect(contract.connect(member2).cancelTask(task.id))
    .to.be.revertedWith("only task owner")
  })

  it("should not cancel if already started", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    await contract.connect(member1).assignTask(task.id, member2.address)
    await expect(contract.connect(member1).cancelTask(task.id))
    .to.be.revertedWith("only new tasks")
  })

  it("should not cancel if paused", async () => {
    await contract.connect(member1).createTask("Get apples", defaultHash,   { value: defaultReward })

    const tasks = await contract.fetchTasksByMember(member1.address)
    const task = tasks[0]
    await contract.connect(admin).pauseContract();
    await expect(contract.connect(member1).cancelTask(task.id))
    .to.be.revertedWith("Pausable: paused")
  })

  // completeTask
  it("should request complete", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    await tx.wait()
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]

    expect(task.status).to.equal(Status.NEW)

    const tx1 = await contract.connect(member2).assignTask(task.id, member1.address)
    await tx1.wait()

    const taskAfter = (await contract.fetchTasksByMember(member2.address))[0]
    expect(taskAfter.status).to.equal(Status.ASSIGNED)
    const tx2 = await contract.connect(member1).completeTask(task.id)
    await tx2.wait()

    const completed = await contract.completed(task.id, member1.address)
    expect(completed).to.equal(true)
  })

  it("should complete task", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    const tx1 = await contract.connect(member2).assignTask(task.id, member1.address)
    const tx2 = await contract.connect(member1).completeTask(task.id)
    const tx3 = await contract.connect(member2).completeTask(task.id)

    const completed1 = await contract.completed(task.id, member1.address)
    const completed2 = await contract.completed(task.id, member2.address)
    expect(completed1).to.equal(true)
    expect(completed2).to.equal(true)

    const tasksAfter = await contract.fetchTasksByMember(member2.address)
    const taskAfter = tasksAfter[0]

    expect(taskAfter.status).to.equal(Status.COMPLETED)
  })

  it("should not complete if called by non members", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    const tx1 = await contract.connect(member2).assignTask(task.id, member1.address)
    await expect(contract.connect(admin).completeTask(task.id)).to.be.revertedWith("only task members")
  })

  it("should not complete when paused", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    const tx1 = await contract.connect(member2).assignTask(task.id, member1.address)
    await contract.connect(admin).pauseContract()
    await expect(contract.connect(member2).completeTask(task.id)).to.be.revertedWith("Pausable: paused")
  })

  it("should not complete if task is not in progress", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]

    await expect(contract.connect(member2).completeTask(task.id)).to.be.revertedWith("task must be in progress")
  })

  it("should not request completion twice", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    await contract.connect(member2).assignTask(task.id, member1.address)
    await contract.connect(member2).completeTask(task.id)
    await expect(contract.connect(member2).completeTask(task.id)).to.be.revertedWith("completion already requested")
  })
  
  // takeReward 
  it("should take reward", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    await contract.connect(member2).assignTask(task.id, member1.address)
    await contract.connect(member2).completeTask(task.id)
    await contract.connect(member1).completeTask(task.id)

    const balaceBefore = await member1.getBalance()
    await contract.connect(member1).takeReward(task.id)
    const balanceAfter = await member1.getBalance()
    const diff = balanceAfter.sub(balaceBefore)
    const fee = defaultReward.mul(feePercent).div(feeBase)

    const fees = await contract.fees()

    expect(diff.toString).to.equal(defaultReward.sub(fee).toString)
    expect(fees.toString()).to.equal(fee.toString())
  })

  it("should not take reward if not colled by assignee", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    await contract.connect(member2).assignTask(task.id, member1.address)
    await contract.connect(member2).completeTask(task.id)
    await contract.connect(member1).completeTask(task.id)

    await expect(contract.connect(member2).takeReward(task.id)).to.be.revertedWith("only task assignee")
  })

  it("should not take reward when paused", async () => {
    const tx = await contract.connect(member2).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member2.address)
    const task = tasks[0]
    await contract.connect(member2).assignTask(task.id, member1.address)
    await contract.connect(member2).completeTask(task.id)
    await contract.connect(member1).completeTask(task.id)

    await contract.connect(admin).pauseContract()
    await expect(contract.connect(member1).takeReward(task.id)).to.be.revertedWith("Pausable: paused")
  })

  it("should not take reward if task is not completed", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    await contract.connect(member3).assignTask(task.id, member1.address)
    await contract.connect(member1).completeTask(task.id)

    await expect(contract.connect(member1).takeReward(task.id)).to.be.revertedWith("task must be completed")
  })

  it("should not take reward if already paid", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    await contract.connect(member3).assignTask(task.id, member1.address)
    await contract.connect(member1).completeTask(task.id)
    await contract.connect(member3).completeTask(task.id)

    await contract.connect(member1).takeReward(task.id)

    await expect(contract.connect(member1).takeReward(task.id)).to.be.revertedWith("task already paid")
  })

  // recallReward
  it("should recall reward", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await contract.connect(member3).cancelTask(task.id)
    const balanceBefore = await member3.getBalance()
    await contract.connect(member3).recallReward(task.id)
    const tasksAfter = await contract.fetchTasksByMember(member3.address)
    const taskAfter = tasksAfter[0]

    expect(taskAfter.paid).to.equal(true)
    expect(taskAfter.reward).to.equal(0)
    const balanceAfter = await member3.getBalance()
    const diff = balanceAfter.sub(balanceBefore)

    // console.log({ before: balanceBefore.toString(), after: balanceAfter.toString(), diff: diff.toString() })

    expect(diff.gt(0)).to.equal(true)
  })

  it("should not recall reward if not called by owner", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    contract.connect(member3).cancelTask(task.id)
    await expect(contract.connect(member2).recallReward(task.id)).to.be.revertedWith("only task owner")
  })

  it("should not recall reward if paused", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    contract.connect(member3).cancelTask(task.id)
    await contract.connect(admin).pauseContract()
    await expect(contract.connect(member3).recallReward(task.id)).to.be.revertedWith("Pausable: paused")
  })

  it("should not recall reward if task not cancelled", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    await expect(contract.connect(member3).recallReward(task.id)).to.be.revertedWith("task must be cancelled")
  })

  it("should not recall reward if task is paid", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]
    await contract.connect(member3).cancelTask(task.id)
    await contract.connect(member3).recallReward(task.id)
    await expect(contract.connect(member3).recallReward(task.id)).to.be.revertedWith("task already paid")
  })

  // raiseClaim
  it("should raise claim", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await contract.connect(member3).assignTask(task.id, member1.address)
    await contract.connect(member3).raiseClaim(task.id, defaultReward.div(2))
    await contract.connect(member1).raiseClaim(task.id, defaultReward)

    const claimFor3Id = await contract.claims(task.id, member3.address, 0)
    const claimFor1Id = await contract.claims(task.id, member1.address, 0)

    const claim3 = await contract.fetchClaimById(claimFor3Id)
    const claim1 = await contract.fetchClaimById(claimFor1Id)

    expect(claim3.amount).to.equal(defaultReward.div(2))
    expect(claim3.taskId).to.equal(task.id)
    expect(claim3.resolution).to.equal(ClaimResolution.OPEN)
    expect(claim3.resolved).to.equal(false)
    expect(claim1.amount).to.equal(defaultReward)
    expect(claim1.taskId).to.equal(task.id)
    expect(claim1.resolution).to.equal(ClaimResolution.OPEN)
    expect(claim1.resolved).to.equal(false)
  })

  it("should not raise claim if called by non members", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await expect(contract.connect(member1).raiseClaim(task.id, defaultReward.div(2))).to.be.revertedWith("only task members")
  })

  it("should not raise claim if already paid", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await contract.connect(member3).cancelTask(task.id)
    await contract.connect(member3).recallReward(task.id)

    await expect(
      contract.connect(member3).raiseClaim(task.id, defaultReward)
      ).to.be.revertedWith("task already paid")
  })

  it("should not raise claim if claim is higher than reward", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await expect(
      contract.connect(member3).raiseClaim(task.id, defaultReward.mul(2))
      ).to.be.revertedWith("claim to high")
  })

  it("should not raise claim if claim and previous claims are higher than reward", async () => {
    const tx = await contract.connect(member3).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member3.address)
    const task = tasks[0]

    await contract.connect(member3).raiseClaim(task.id, defaultReward.div(2))
    await expect(
      contract.connect(member3).raiseClaim(task.id, defaultReward)
      ).to.be.revertedWith("claim to high")
  })

  // settleClaim
  it("should approve claim", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    expect(claim.resolution).to.equal(ClaimResolution.OPEN)

    const balanceBefore = await member4.getBalance()

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED);

    const balanceAfter = await member4.getBalance()

    const claimAfter = await contract.fetchClaimById(claim4Id)
    expect(claimAfter.resolution).to.equal(ClaimResolution.APPROVED)
    expect(claimAfter.resolved).to.equal(true)
    expect(claimAfter.amount.eq(defaultReward.div(2))).to.equal(true)

    expect(balanceAfter.gt(balanceBefore)).to.equal(true)
  });

  it("should reject claim", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    expect(claim.resolution).to.equal(ClaimResolution.OPEN)
    const balanceBefore = await member4.getBalance()

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DENIED);
    const balanceAfter = await member4.getBalance()

    const claimAfter = await contract.fetchClaimById(claim4Id)
    expect(claimAfter.resolution).to.equal(ClaimResolution.DENIED)
    expect(claimAfter.resolved).to.equal(true)
    expect(balanceAfter.gt(balanceBefore)).to.equal(false)
  })

  it("should dispute claim", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    expect(claim.resolution).to.equal(ClaimResolution.OPEN)
    const balanceBefore = await member4.getBalance()

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DISPUTE);
    const balanceAfter = await member4.getBalance()

    const claimAfter = await contract.fetchClaimById(claim4Id)
    expect(claimAfter.resolution).to.equal(ClaimResolution.DISPUTE)
    expect(claimAfter.resolved).to.equal(false)
    expect(balanceAfter.gt(balanceBefore)).to.equal(false)
  })

  it("should not settle if not called by admin", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await expect(
      contract.connect(member1).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DISPUTE)
      ).to.be.revertedWith("only admin")
  })

  it("should not settle if paused", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await contract.connect(admin).pauseContract()

    await expect(
      contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DISPUTE)
      ).to.be.revertedWith("Pausable: paused")
  })

  it("should not settle for non task members", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await expect(
      contract.connect(admin).settleClaim(task.id, member2.address, claim.id, ClaimResolution.DISPUTE)
      ).to.be.revertedWith("resolve for only task members")
  })

  it("should not settle if already resolved", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    const tx1 = await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED)

    await tx1.wait()

    await expect(
      contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DISPUTE)
      ).to.be.revertedWith("already resolved")
  })

  it("should not settle if claim not open", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward.div(2))
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    const tx1 = await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.DISPUTE)

    await tx1.wait()

    await expect(
      contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED)
      ).to.be.revertedWith("only open claims")
  })

  // transferOwnership
  it("should transfer ownership", async () => {
    await contract.connect(admin).transferOwnership(member1.address)

    const newOwner = await contract.admin()
    expect(newOwner).to.equal(member1.address)
  })

  it("should not transfer ownership if not called by admin", async () => {
    await expect(contract.connect(member1).transferOwnership(member1.address)).to.be.revertedWith("only admin")
  })

  // updateFees
  it("should update fees", async () => {
    await contract.connect(admin).updateFees(2, 100)

    const feePercent = await contract.feePercent()
    expect(feePercent.toString()).to.equal("2")
  })

  it("should not update fees if not called by admin", async () => {
    await expect(contract.connect(member1).updateFees(2, 100)).to.be.revertedWith("only admin")
  })

  // takeFees
  it("should take fees", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward)
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED);

    const feesBalance = await contract.fees()
    expect(feesBalance).not.to.equal(0)

    const adminBalance = await admin.getBalance()

    await contract.connect(admin).takeFees(feesBalance)
    const feesBalanceAfter = await contract.fees()
    const adminBalanceAfter = await admin.getBalance()

    expect(feesBalanceAfter).to.equal(0)
    expect(adminBalanceAfter.sub(adminBalance).gt(0)).to.equal(true)
  })

  it("should not take fees if not called by admin", async () => {
    await expect(contract.connect(member1).takeFees(defaultReward)).to.be.revertedWith("only admin")
  })

  it("should not take fees if no amount provided", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward)
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED);

    await expect(contract.connect(admin).takeFees(0)).to.be.revertedWith("must give an amount")
  })

  it("should not take fees if amount provided is to large", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward)
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED);

    await expect(contract.connect(admin).takeFees(defaultReward)).to.be.revertedWith("amount too large")
  })


  it("should not take fees when paused", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).raiseClaim(task.id, defaultReward)
    const claim4Id = await contract.claims(task.id, member4.address, 0)
    const claim = await contract.fetchClaimById(claim4Id)

    await contract.connect(admin).settleClaim(task.id, member4.address, claim.id, ClaimResolution.APPROVED);
    await contract.connect(admin).pauseContract()

    await expect(contract.connect(admin).takeFees(defaultReward)).to.be.revertedWith("Pausable: paused")
  })

  // refund
  it("should refund", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    const member4Balance = await member4.getBalance()

    await contract.connect(admin).refund(defaultReward, task.id, member4.address)

    const member4BalanceAfter = await member4.getBalance()

    expect(member4BalanceAfter.sub(member4Balance).gt(0)).to.equal(true)
  })

  it("should not refund if not called by admin", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await expect(contract.connect(member4).refund(defaultReward, task.id, member4.address)).to.be.revertedWith("only admin")
  })

  it("should not refund if task already paid", async () => {
    const tx = await contract.connect(member4).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member4.address)
    const task = tasks[0]

    await contract.connect(member4).assignTask(task.id, member1.address)
    await contract.connect(member4).completeTask(task.id)
    await contract.connect(member1).completeTask(task.id)

    await contract.connect(member1).takeReward(task.id)

    await expect(contract.connect(admin).refund(defaultReward.div(2), task.id, member4.address)).to.be.revertedWith("task already paid")
  })

  it("should not refund if amount is larger than reward", async () => {
    const tx = await contract.connect(member5).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member5.address)
    const task = tasks[0]

    await expect(contract.connect(admin).refund(defaultReward.mul(2), task.id, member5.address)).to.be.revertedWith("refund is too large")

  })

  it("should not refund non task members", async () => {
    const tx = await contract.connect(member5).createTask("Get apples", defaultHash,   { value: defaultReward })
    const tasks = await contract.fetchTasksByMember(member5.address)
    const task = tasks[0]

    await expect(contract.connect(admin).refund(defaultReward.div(2), task.id, member4.address)).to.be.revertedWith("only task members")
  })

  // pause/unpause
  it("should pause contract", async () => {
    await contract.connect(admin).pauseContract()

    const paused  = await contract.paused()
    expect(paused).to.equal(true)
  })

  it("should unpause contract", async () => {
    await contract.connect(admin).pauseContract()

    const paused  = await contract.paused()
    expect(paused).to.equal(true)

    await contract.connect(admin).unpauseContract()
    const pausedAfter  = await contract.paused()
    expect(pausedAfter).to.equal(false)
  })

  it("should not pause/unpuase if not admin", async () => {
    await expect(contract.connect(member1).pauseContract()).to.be.revertedWith("only admin")
    await expect(contract.connect(member2).unpauseContract()).to.be.revertedWith("only admin")
  })

  //fetchTaskByHash
  it("should fetch task by hash", async () => {
    const tx = await contract.connect(member5).createTask("Get apples", defaultHash,   { value: defaultReward })

    const task = await contract.fetchTaskByHash(defaultHash)
    expect(task.owner).to.equal(member5.address)
  })

    //fetchTaskById
    it("should fetch task by hash", async () => {
      const tx = await contract.connect(member5).createTask("Get apples", defaultHash,   { value: defaultReward })
      const tasks = await contract.fetchTasksByMember(member5.address)
      const task = tasks[0]

      const taskById = await contract.fetchTaskById(task.id)
      expect(taskById.owner).to.equal(member5.address)
    })
});
