-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MENTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('REGULAR', 'MAKEUP', 'EXAM');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'STARTED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('SELF_SUBMITTED', 'MANUAL');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'FREELANCE', 'NOT_LOOKING');

-- CreateEnum
CREATE TYPE "WorkplacePreference" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "HireStatus" AS ENUM ('EMPLOYED', 'JOB_SEEKING', 'FREELANCING', 'STUDENT_ONLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSettings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "defaultAttendanceDurationMins" INTEGER NOT NULL DEFAULT 15,
    "lateThresholdMins" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "avatarUrl" TEXT,
    "institution" TEXT,
    "department" TEXT,
    "studentId" TEXT,
    "graduationYear" INTEGER,
    "skills" TEXT[],
    "hireStatus" "HireStatus" NOT NULL DEFAULT 'STUDENT_ONLY',
    "jobType" "JobType" NOT NULL DEFAULT 'NOT_LOOKING',
    "workplacePreference" "WorkplacePreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "currentEmployer" TEXT,
    "currentPosition" TEXT,
    "portfolioUrl" TEXT,
    "linkedinUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER,
    "defaultMeetLink" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lateThresholdMinsOverride" INTEGER,
    "attendanceDurationMinsOverride" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMembership" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "isCR" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "BatchMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "meetLink" TEXT,
    "type" "SessionType" NOT NULL DEFAULT 'REGULAR',
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attendanceOpenedAt" TIMESTAMP(3),
    "attendanceOpenedById" TEXT,
    "attendanceClosedAt" TIMESTAMP(3),
    "attendanceClosedById" TEXT,
    "currentCode" TEXT,
    "codeRotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentBatchMembershipId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "method" "AttendanceMethod" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "markedById" TEXT,
    "manualReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSettings_workspaceId_key" ON "WorkspaceSettings"("workspaceId");

-- CreateIndex
CREATE INDEX "Membership_workspaceId_idx" ON "Membership"("workspaceId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_workspaceId_role_key" ON "Membership"("userId", "workspaceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_membershipId_key" ON "StudentProfile"("membershipId");

-- CreateIndex
CREATE INDEX "StudentProfile_hireStatus_idx" ON "StudentProfile"("hireStatus");

-- CreateIndex
CREATE INDEX "StudentProfile_jobType_idx" ON "StudentProfile"("jobType");

-- CreateIndex
CREATE INDEX "Batch_workspaceId_idx" ON "Batch"("workspaceId");

-- CreateIndex
CREATE INDEX "Batch_isArchived_idx" ON "Batch"("isArchived");

-- CreateIndex
CREATE INDEX "BatchMembership_batchId_idx" ON "BatchMembership"("batchId");

-- CreateIndex
CREATE INDEX "BatchMembership_membershipId_idx" ON "BatchMembership"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchMembership_membershipId_batchId_key" ON "BatchMembership"("membershipId", "batchId");

-- CreateIndex
CREATE INDEX "Session_batchId_idx" ON "Session"("batchId");

-- CreateIndex
CREATE INDEX "Session_scheduledStart_idx" ON "Session"("scheduledStart");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_idx" ON "Attendance"("sessionId");

-- CreateIndex
CREATE INDEX "Attendance_studentBatchMembershipId_idx" ON "Attendance"("studentBatchMembershipId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_studentBatchMembershipId_key" ON "Attendance"("sessionId", "studentBatchMembershipId");

-- AddForeignKey
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMembership" ADD CONSTRAINT "BatchMembership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMembership" ADD CONSTRAINT "BatchMembership_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentBatchMembershipId_fkey" FOREIGN KEY ("studentBatchMembershipId") REFERENCES "BatchMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
