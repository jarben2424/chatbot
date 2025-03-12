import { auth } from '@/app/(auth)/auth';
import { deleteDashboardQuery, saveDashboardQuery } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, question, sqlQuery } = await req.json();

    if (!title || !question || !sqlQuery) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure we have a user ID
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    await saveDashboardQuery({
      title,
      question,
      sqlQuery,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving dashboard query:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard query' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing query ID' },
        { status: 400 }
      );
    }

    await deleteDashboardQuery({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard query:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard query' },
      { status: 500 }
    );
  }
}
