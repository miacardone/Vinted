import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/Feedback';
import { formatDateTime, relativeTime } from '@/utils/format';

export function HistoryTab({ history = [] }) {
  if (!history.length) {
    return <EmptyState icon="clock" title="No history yet" body="Actions taken on this case will be recorded here." />;
  }

  // Newest first — the last thing that happened is what an analyst needs.
  const ordered = [...history].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="timeline">
      {ordered.map((event) => (
        <div key={event.id} className="timeline__item">
          <span className="timeline__marker" />
          <div className="timeline__body">
            <span className="timeline__action">{event.action}</span>
            <span className="timeline__meta">
              {event.actor} · {formatDateTime(event.at)} · {relativeTime(event.at)}
            </span>
            {event.detail && <span className="timeline__detail">{event.detail}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesTab({ notes = [], onAddNote, busy }) {
  const [draft, setDraft] = useState('');

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    await onAddNote(body);
    setDraft('');
  };

  const ordered = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.at) - new Date(a.at);
  });

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <Textarea
          label="Add a note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="What did you find, and what happens next?"
        />
        <div className="row row--end">
          <Button variant="primary" size="sm" icon="send" onClick={submit} disabled={!draft.trim() || busy}>
            {busy ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="small muted">No notes on this case yet.</p>
      ) : (
        <div className="stack stack--tight">
          {ordered.map((note) => (
            <article key={note.id} className={`note ${note.pinned ? 'note--pinned' : ''}`.trim()}>
              <p className="small">{note.body}</p>
              <div className="note__meta">
                {note.pinned && <Icon name="tag" size={11} style={{ color: 'var(--c-primary)' }} />}
                <span>{note.author}</span>
                <span>·</span>
                <span>{formatDateTime(note.at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryTab;
