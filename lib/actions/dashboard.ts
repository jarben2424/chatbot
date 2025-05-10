'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { dashboards, visualizations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from '@/lib/utils'

export async function getDashboards() {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const result = await db
    .select({
      id: dashboards.id,
      title: dashboards.title,
      createdAt: dashboards.createdAt
    })
    .from(dashboards)
    .where(eq(dashboards.userId, session.user.id))
    .orderBy(dashboards.createdAt)
    
  // Count visualizations for each dashboard
  const dashboardsWithCounts = await Promise.all(
    result.map(async (dashboard) => {
      const visualizationCount = await db
        .select({ count: count() })
        .from(visualizations)
        .where(eq(visualizations.dashboardId, dashboard.id))
        .then(res => res[0]?.count || 0)
        
      return {
        ...dashboard,
        visualizationCount
      }
    })
  )

  return dashboardsWithCounts
}

export async function getDashboardById(id: string) {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const dashboard = await db
    .select()
    .from(dashboards)
    .where(eq(dashboards.id, id))
    .then(res => res[0] || null)
    
  if (!dashboard) {
    return null
  }
  
  const dashboardVisualizations = await db
    .select()
    .from(visualizations)
    .where(eq(visualizations.dashboardId, dashboard.id))
    .orderBy(visualizations.createdAt)

  return {
    ...dashboard,
    visualizations: dashboardVisualizations
  }
}

export async function createDashboard(title: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const id = nanoid()
  await db.insert(dashboards).values({
    id,
    userId: session.user.id,
    title: title || 'New Dashboard'
  })

  revalidatePath('/dashboard')
  return id
}

export async function removeDashboard(id: string) {
  const session = await auth()
  if (!session?.user) {
    return {
      error: 'Unauthorized'
    }
  }

  // Check if the dashboard exists and belongs to the user
  const dashboard = await db
    .select()
    .from(dashboards)
    .where(eq(dashboards.id, id))
    .then(res => res[0] || null)

  if (!dashboard || dashboard.userId !== session.user.id) {
    return {
      error: 'Dashboard not found'
    }
  }

  // Delete visualizations first
  await db.delete(visualizations).where(eq(visualizations.dashboardId, id))
  
  // Then delete the dashboard
  await db.delete(dashboards).where(eq(dashboards.id, id))

  revalidatePath('/dashboard')
  return {}
}

export function isDashboardOwner(dashboard: any, userId: string) {
  return dashboard.userId === userId
}

export interface AddVisualizationParams {
  dashboardId: string;
  visualizationId: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export async function addVisualizationToDashboard({
  dashboardId,
  visualizationId,
  position
}: AddVisualizationParams) {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    // Get the artifact/visualization from artifacts
    const artifact = await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.id, visualizationId))
      .then(res => res[0] || null);

    if (!artifact) {
      return {
        success: false,
        error: 'Visualization not found'
      };
    }

    // Create visualization entry
    const id = nanoid();
    await db.insert(visualizations).values({
      id,
      dashboardId,
      userId: session.user.id,
      title: artifact.title,
      type: artifact.content.visualization || 'bar',
      data: artifact.content.data,
      settings: artifact.content.settings || {},
      position
    });

    revalidatePath(`/dashboard/${dashboardId}`);
    
    return {
      success: true,
      dashboardId,
      visualizationId: id
    };
  } catch (error) {
    console.error('Error adding visualization to dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function removeVisualizationFromDashboard({
  dashboardId,
  visualizationId
}: {
  dashboardId: string;
  visualizationId: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    // Check if the dashboard exists and belongs to the user
    const dashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, dashboardId))
      .then(res => res[0] || null);

    if (!dashboard || dashboard.userId !== session.user.id) {
      return {
        success: false,
        error: 'Dashboard not found'
      };
    }

    // Delete the visualization
    await db
      .delete(visualizations)
      .where(and(
        eq(visualizations.id, visualizationId),
        eq(visualizations.dashboardId, dashboardId)
      ));

    revalidatePath(`/dashboard/${dashboardId}`);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error removing visualization from dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 