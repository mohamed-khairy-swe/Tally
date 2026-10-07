import { useState } from "react";

interface AddProfileDialogProps {
  onCreate: (name: string) => void;
  onCancel: () => void;
}

function AddProfileDialog({
  onCreate,
  onCancel,
}: AddProfileDialogProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return;
    }

    onCreate(trimmedName);
  }

  return (
    <div
      role="presentation"
      className="dialog-backdrop"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-profile-title"
        className="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="add-profile-title">
          Create settings profile
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="profile-name">
            Profile name
          </label>

          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Deep Work"
            autoFocus
            maxLength={50}
          />

          <div className="dialog__actions">
            <button
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={name.trim().length === 0}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProfileDialog;