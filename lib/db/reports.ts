import { db } from './index';
import { and, eq, desc } from 'drizzle-orm';
import { report, reportRecipient, reportHistory } from './schema';

export type ReportData = {
  title: string;
  description?: string;
  type: 'dashboard_update' | 'anomaly_detection' | 'recommendation';
  content: Record<string, unknown>;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  customSchedule?: string;
  userId: string;
};

export type ReportRecipientData = {
  reportId: string;
  email: string;
  name?: string;
};

// Get all reports for a user
export async function getReportsForUser(userId: string) {
  return db
    .select()
    .from(report)
    .where(eq(report.userId, userId))
    .orderBy(desc(report.updatedAt));
}

// Get a specific report by ID
export async function getReportById(reportId: string) {
  const [result] = await db
    .select()
    .from(report)
    .where(eq(report.id, reportId))
    .limit(1);
  
  return result;
}

// Create a new report
export async function createReport(data: ReportData) {
  const [result] = await db
    .insert(report)
    .values({
      title: data.title,
      description: data.description,
      type: data.type,
      content: data.content,
      schedule: data.schedule,
      customSchedule: data.customSchedule,
      userId: data.userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return result;
}

// Update an existing report
export async function updateReport(reportId: string, data: Partial<ReportData>) {
  const [result] = await db
    .update(report)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(report.id, reportId))
    .returning();
  
  return result;
}

// Set report active/inactive status
export async function setReportStatus(reportId: string, isActive: boolean) {
  const [result] = await db
    .update(report)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(report.id, reportId))
    .returning();
  
  return result;
}

// Delete a report
export async function deleteReport(reportId: string) {
  const [result] = await db
    .delete(report)
    .where(eq(report.id, reportId))
    .returning();
  
  return result;
}

// Get recipients for a report
export async function getReportRecipients(reportId: string) {
  return db
    .select()
    .from(reportRecipient)
    .where(eq(reportRecipient.reportId, reportId))
    .orderBy(desc(reportRecipient.createdAt));
}

// Add a recipient to a report
export async function addReportRecipient(data: ReportRecipientData) {
  const [result] = await db
    .insert(reportRecipient)
    .values({
      reportId: data.reportId,
      email: data.email,
      name: data.name,
      createdAt: new Date(),
    })
    .returning();
  
  return result;
}

// Remove a recipient from a report
export async function removeReportRecipient(recipientId: string) {
  const [result] = await db
    .delete(reportRecipient)
    .where(eq(reportRecipient.id, recipientId))
    .returning();
  
  return result;
}

// Get report history
export async function getReportHistory(reportId: string) {
  return db
    .select()
    .from(reportHistory)
    .where(eq(reportHistory.reportId, reportId))
    .orderBy(desc(reportHistory.sentAt));
}

// Add a history entry
export async function addReportHistory(
  reportId: string, 
  status: 'success' | 'failure',
  recipientCount: number,
  content: Record<string, unknown>
) {
  const [result] = await db
    .insert(reportHistory)
    .values({
      reportId,
      status,
      sentAt: new Date(),
      recipientCount,
      content,
    })
    .returning();
  
  return result;
}
