import { Save, X } from 'lucide-react';
import type { SegmentDraft } from './useSegments';

interface Props {
  segmentDraft: SegmentDraft;
  setSegmentDraft: (draft: SegmentDraft) => void;
  savingSegment: boolean;
  cancelSegmentEdit: () => void;
  saveSegment: () => Promise<void>;
}

export function SegmentEditorCard({ segmentDraft, setSegmentDraft, savingSegment, cancelSegmentEdit, saveSegment }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-gray-500">Назва сегмента</label>
        <input
          value={segmentDraft.segmentName}
          onChange={(e) => setSegmentDraft({ ...segmentDraft, segmentName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Наприклад, VIP Reactivation"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['rScores', 'fScores', 'mScores'] as const).map((field, i) => (
          <div key={field}>
            <label className="text-xs text-gray-500">{['R', 'F', 'M'][i]}</label>
            <input
              value={segmentDraft[field]}
              onChange={(e) => setSegmentDraft({ ...segmentDraft, [field]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
        <input
          type="color"
          value={segmentDraft.colorHex}
          onChange={(e) => setSegmentDraft({ ...segmentDraft, colorHex: e.target.value })}
          className="h-10 w-14 border border-gray-300 rounded-lg bg-white p-1"
        />
        <div>
          <input
            type="range"
            min="5"
            max="100"
            value={segmentDraft.colorOpacity}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, colorOpacity: Number(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-500">{segmentDraft.colorOpacity}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Пріоритет</label>
          <input
            type="number"
            value={segmentDraft.priority}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, priority: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Частота, днів</label>
          <input
            type="number"
            value={segmentDraft.communicationFrequencyDays}
            onChange={(e) => setSegmentDraft({ ...segmentDraft, communicationFrequencyDays: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500">Рекомендована дія</label>
        <textarea
          value={segmentDraft.recommendedAction}
          onChange={(e) => setSegmentDraft({ ...segmentDraft, recommendedAction: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={cancelSegmentEdit} className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700">
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => void saveSegment()}
          disabled={savingSegment}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Зберегти
        </button>
      </div>
    </div>
  );
}
