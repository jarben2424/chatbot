'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { dashboards, visualizations, artifacts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from '@/lib/utils'

export async function getDashboards() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error('Unauthorized: User not logged in')
  }

  try {
    const result = await db.query.dashboards.findMany({
      where: eq(dashboards.userId, userId),
      orderBy: (dashboards, { desc }) => [desc(dashboards.createdAt)]
    })

    return result
  } catch (error) {
    console.error('Failed to get dashboards:', error)
    throw new Error('Failed to get dashboards')
  }
}

export async function getDashboardById(id: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error('Unauthorized: User not logged in')
  }

  try {
    const dashboard = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, id),
        eq(dashboards.userId, userId)
      ),
      with: {
        visualizations: true
      }
    })

    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    return dashboard
  } catch (error) {
    console.error('Failed to get dashboard:', error)
    throw new Error('Failed to get dashboard')
  }
}

export async function createDashboard(data: { title: string; description?: string }) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    throw new Error('Unauthorized: User not logged in')
  }

  try {
    const result = await db.insert(dashboards).values({
      id: nanoid(),
      userId,
      title: data.title,
      description: data.description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    revalidatePath('/dashboard')
    return result[0]
  } catch (error) {
    console.error('Failed to create dashboard:', error)
    throw new Error('Failed to create dashboard')
  }
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

export async function addToDashboard({ 
  artifactId, 
  dashboardId 
}: { 
  artifactId: string; 
  dashboardId: string 
}) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: 'Unauthorized: User not logged in' }
  }

  if (!artifactId || !dashboardId) {
    return { success: false, error: 'Missing required parameters' }
  }

  try {
    // Get the artifact data
    const artifact = await db.query.artifacts.findFirst({
      where: and(
        eq(artifacts.id, artifactId),
        eq(artifacts.userId, userId)
      )
    })

    if (!artifact) {
      return { success: false, error: 'Artifact not found' }
    }

    // Insert into visualizations
    const result = await db.insert(visualizations).values({
      id: nanoid(),
      dashboardId,
      title: artifact.title || 'Visualization',
      description: '',
      type: artifact.type,
      data: artifact.content,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      position: { x: 0, y: 0, w: 6, h: 4 }
    }).returning()

    revalidatePath(`/dashboard/${dashboardId}`)
    return { success: true, visualization: result[0] }
  } catch (error) {
    console.error('Failed to add to dashboard:', error)
    return { success: false, error: 'Failed to add to dashboard' }
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