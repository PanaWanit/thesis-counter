import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import type { Category } from '../types';
import { listCategories, createCategory, deleteCategory } from '../db';
import { AppIcon } from './Icons';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    const data = await listCategories();
    setCategories(data);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await refresh();
      } catch (loadError) {
        console.error('Failed to load categories:', loadError);
        setError('Could not load categories.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createCategory(name.trim(), color);
      setName('');
      await refresh();
    } catch (saveError) {
      console.error('Failed to create category:', saveError);
      setError('Could not add this category. Use a unique name and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setError('');
    try {
      await deleteCategory(id);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      console.error('Failed to delete category:', deleteError);
      setError('This category is used by saved sessions and cannot be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="categories-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Research system</p>
          <h2 id="categories-title">Categories</h2>
          <p className="supporting-copy">Build a small vocabulary for the kinds of thesis work you do.</p>
        </div>
        <span className="count-pill">{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
      </div>

      {error && (
        <div className="alert" role="alert">
          <AppIcon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="category-layout">
        <section className="panel" aria-labelledby="new-category-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">New label</p>
              <h3 id="new-category-title">Add category</h3>
            </div>
            <AppIcon name="plus" size={21} />
          </div>

          <form className="category-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="category-name">Category name</label>
              <input
                id="category-name"
                className="control"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Literature review"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="category-color">Data color</label>
              <div className="color-control-row">
                <input
                  id="category-color"
                  className="control color-input"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  aria-describedby="category-color-help"
                />
                <span className="color-value">{color.toUpperCase()}</span>
              </div>
              <p id="category-color-help" className="helper-text">Used in progress breakdowns and session labels.</p>
            </div>
            <button className="button button-primary button-block" type="submit" disabled={saving || name.trim() === ''}>
              <AppIcon name="plus" size={18} />
              {saving ? 'Adding…' : 'Add category'}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="category-list-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Current vocabulary</p>
              <h3 id="category-list-title">Your categories</h3>
            </div>
            <AppIcon name="categories" size={21} />
          </div>

          {loading ? (
            <div className="loading-stack" aria-label="Loading categories">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state compact">
              <span className="empty-icon"><AppIcon name="categories" size={25} /></span>
              <h3>No categories yet</h3>
              <p>Add a category to unlock the focus timer and session entry.</p>
            </div>
          ) : (
            <ul className="category-list">
              {categories.map((category) => {
                const categoryStyle = { '--category-color': category.color } as CSSProperties;
                return (
                  <li className="category-row" key={category.id}>
                    <span className="category-swatch" style={categoryStyle} aria-hidden="true" />
                    <div>
                      <div className="category-row-name">{category.name}</div>
                      <div className="category-row-color">{category.color.toUpperCase()}</div>
                    </div>
                    {pendingDelete === category.id ? (
                      <div className="inline-confirm">
                        <span>Delete?</span>
                        <button className="button button-secondary button-small" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
                        <button className="button button-danger button-small" type="button" disabled={deleting} onClick={() => handleDelete(category.id)}>{deleting ? 'Deleting…' : 'Delete'}</button>
                      </div>
                    ) : (
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Delete ${category.name}`}
                        title={`Delete ${category.name}`}
                        onClick={() => {
                          setError('');
                          setPendingDelete(category.id);
                        }}
                      >
                        <AppIcon name="trash" size={17} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
