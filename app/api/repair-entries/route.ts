import { NextRequest, NextResponse } from 'next/server';
import { 
  addRepairEntryToMongoDB, 
  getRepairEntriesFromMongoDB,
  updateRepairEntryInMongoDB,
  deleteRepairEntryFromMongoDB 
} from '@/lib/mongoStorage';

// GET - Get all repair entries for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const entries = await getRepairEntriesFromMongoDB(userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error getting repair entries:', error);
    return NextResponse.json({ error: 'Failed to get repair entries' }, { status: 500 });
  }
}

// POST - Add new repair entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received repair entry data:', body);

    if (!body.userId) {
      console.log('Error: No user ID provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Attempting to save to MongoDB...');
    const entryId = await addRepairEntryToMongoDB(body);
    console.log('Successfully saved with ID:', entryId);
    return NextResponse.json({ id: entryId });
  } catch (error) {
    console.error('Error adding repair entry:', error);
    return NextResponse.json({ error: 'Failed to add repair entry: ' + error.message }, { status: 500 });
  }
}

// PUT - Update repair entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    await updateRepairEntryInMongoDB(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating repair entry:', error);
    return NextResponse.json({ error: 'Failed to update repair entry' }, { status: 500 });
  }
}

// DELETE - Delete repair entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    await deleteRepairEntryFromMongoDB(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair entry:', error);
    return NextResponse.json({ error: 'Failed to delete repair entry' }, { status: 500 });
  }
}
