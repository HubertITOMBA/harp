import { NextRequest, NextResponse } from 'next/server';
import { getTaskById } from '@/actions/task-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: "ID de tâche invalide" },
        { status: 400 }
      );
    }

    const result = await getTaskById(taskId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
