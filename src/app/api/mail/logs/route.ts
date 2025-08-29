import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'sent', 'failed', 'pending'
    const type = searchParams.get('type'); // 'welcome', 'course_assignment', etc.

    const logs = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('mail_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filtres optionnels
      if (status) {
        query = query.eq('status', status);
      }
      
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    });

    // Compter le total pour la pagination
    const totalCount = await executeWithRetry(async (supabase) => {
      let query = supabase
        .from('mail_logs')
        .select('*', { count: 'exact', head: true });

      if (status) {
        query = query.eq('status', status);
      }
      
      if (type) {
        query = query.eq('type', type);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    });

    return NextResponse.json({
      logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs de mails' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to_emails, subject, status, error_message, user_id, course_id } = body;

    // Validation
    if (!type || !to_emails || !subject || !status) {
      return NextResponse.json(
        { error: 'Les champs type, to_emails, subject et status sont requis' },
        { status: 400 }
      );
    }

    const logEntry = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('mail_logs')
        .insert({
          type,
          to_emails: Array.isArray(to_emails) ? to_emails.join(',') : to_emails,
          subject,
          status,
          error_message,
          user_id,
          course_id,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    });

    return NextResponse.json(logEntry, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du log:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du log de mail' },
      { status: 500 }
    );
  }
}