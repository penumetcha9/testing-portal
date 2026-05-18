import { useState, useCallback, useRef, useEffect } from 'react';

// ── Paste sanitizer ──────────────────────────────────────────────────────────
// Pasted rich content (Word, Google Docs, Excel, web pages, screenshots) is
// kept "as is" — bold/italic/underline, bullet & numbered lists, tables,
// images/diagrams, headings, links and line breaks — while unsafe or noisy
// markup (scripts, classes, fonts, colors, inline widths, etc.) is stripped.
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Structural / formatting tags we keep. Anything else is unwrapped (its
// contents are kept) or — for the dangerous set below — dropped entirely.
const ALLOWED_TAGS = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP', 'MARK',
    'BR', 'HR', 'P', 'DIV', 'SPAN', 'BLOCKQUOTE', 'PRE', 'CODE',
    'UL', 'OL', 'LI',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'CAPTION', 'COLGROUP', 'COL',
    'A', 'IMG',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
]);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED']);
const VOID_TAGS = new Set(['BR', 'HR', 'IMG', 'COL']);
const ALLOWED_ATTRS = { A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'] };
// Only structural style props survive — keeps pasted content on-theme.
const STYLE_KEEP = ['font-weight', 'font-style', 'text-decoration', 'text-align', 'vertical-align'];

const sanitizeStyle = (style) => {
    if (!style) return '';
    const kept = [];
    style.split(';').forEach(decl => {
        const i = decl.indexOf(':');
        if (i < 0) return;
        const prop = decl.slice(0, i).trim().toLowerCase();
        const val = decl.slice(i + 1).trim().replace(/["';]/g, '');
        if (val && STYLE_KEEP.includes(prop)) kept.push(`${prop}: ${val}`);
    });
    return kept.join('; ');
};

const safeUrl = (url, isImage) => {
    const u = (url || '').trim();
    if (isImage) return (/^data:image\//i.test(u) || /^https?:\/\//i.test(u)) ? u : '';
    return /^(https?:|mailto:)/i.test(u) ? u : '';
};

const cleanPastedNode = (node) => {
    if (node.nodeType === 3) return escapeText(node.textContent.replace(/\s+/g, ' '));
    if (node.nodeType !== 1) return '';
    const tag = node.tagName;
    if (DROP_TAGS.has(tag)) return '';

    const inner = VOID_TAGS.has(tag) ? '' : Array.from(node.childNodes).map(cleanPastedNode).join('');
    if (!ALLOWED_TAGS.has(tag)) return inner; // unwrap unknown tag, keep contents

    const t = tag.toLowerCase();
    let attrs = '';
    const style = sanitizeStyle(node.getAttribute('style'));
    if (style) attrs += ` style="${escapeAttr(style)}"`;
    (ALLOWED_ATTRS[tag] || []).forEach(name => {
        const raw = node.getAttribute(name);
        if (!raw) return;
        if (name === 'href') {
            const v = safeUrl(raw, false);
            if (v) attrs += ` href="${escapeAttr(v)}" target="_blank" rel="noopener noreferrer"`;
        } else if (name === 'src') {
            const v = safeUrl(raw, true);
            if (v) attrs += ` src="${escapeAttr(v)}"`;
        } else if (name === 'colspan' || name === 'rowspan') {
            const n = parseInt(raw, 10);
            if (n > 1) attrs += ` ${name}="${n}"`;
        } else {
            attrs += ` ${name}="${escapeAttr(raw)}"`;
        }
    });

    if (VOID_TAGS.has(tag)) {
        if (tag === 'IMG' && !/\bsrc=/.test(attrs)) return ''; // image with no usable src
        return `<${t}${attrs}>`;
    }
    return `<${t}${attrs}>${inner}</${t}>`;
};

const sanitizePastedHtml = (html) => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    return Array.from(holder.childNodes).map(cleanPastedNode).join('').trim();
};

// ── CollapsibleTextarea ──────────────────────────────────────────────────────
// A contenteditable rich editor: keeps pasted formatting/tables/images,
// Ctrl/Cmd+B bolds the selection, Enter starts a `• ` bullet line, and an
// expand/collapse toggle. Relies on the `.usm-editor` rules in index.css.
export const CollapsibleTextarea = ({ value, onChange, placeholder, rows = 3, className = '', style, ...rest }) => {
    const [expanded, setExpanded] = useState(false);
    const editorRef = useRef(null);
    const skipSync = useRef(false);

    // Sync external value → DOM, but skip the next sync that follows our own
    // emit (otherwise we'd blow away the user's cursor on every keystroke).
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (skipSync.current) { skipSync.current = false; return; }
        if (el.innerHTML !== (value || '')) {
            el.innerHTML = value || '';
        }
    }, [value]);

    const emit = useCallback(() => {
        skipSync.current = true;
        onChange({ target: { value: editorRef.current?.innerHTML || '' } });
    }, [onChange]);

    const handleKeyDown = (e) => {
        // Ctrl/Cmd + B → wrap the current selection in a real <b> tag.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            if (range.collapsed) return; // nothing selected → do nothing
            const b = document.createElement('b');
            try {
                range.surroundContents(b);
            } catch {
                // surroundContents fails across element boundaries; fall back.
                b.appendChild(range.extractContents());
                range.insertNode(b);
            }
            range.setStartAfter(b);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            emit();
            return;
        }

        // Enter (without Shift) → insert a bullet on a new line at the cursor.
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const bullet = document.createTextNode('\n• ');
            range.insertNode(bullet);
            range.setStartAfter(bullet);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            emit();
        }
    };

    // Embed pasted/screenshot images inline as base64 data URLs.
    const embedImages = (files, range) => {
        const at = range.cloneRange();
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = document.createElement('img');
                img.src = reader.result;
                at.insertNode(img);
                at.setStartAfter(img);
                at.collapse(true);
                const sel = window.getSelection();
                if (sel) { sel.removeAllRanges(); sel.addRange(at); }
                emit();
            };
            reader.readAsDataURL(file);
        });
    };

    // Paste: keep the copied content as-is — formatting, bullets, tables,
    // images/diagrams and line breaks.
    const handlePaste = (e) => {
        e.preventDefault();
        const cd = e.clipboardData || window.clipboardData;
        if (!cd) return;
        const html = cd.getData('text/html');
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);

        // Raw image / screenshot paste (no HTML payload) → embed it.
        let imageFiles = Array.from(cd.files || []).filter(f => f.type.startsWith('image/'));
        if (!imageFiles.length && cd.items) {
            imageFiles = Array.from(cd.items)
                .filter(it => it.kind === 'file' && it.type.startsWith('image/'))
                .map(it => it.getAsFile())
                .filter(Boolean);
        }
        if (!html.trim() && imageFiles.length) {
            range.deleteContents();
            embedImages(imageFiles, range);
            return;
        }

        range.deleteContents();
        let frag;
        if (html.trim()) {
            frag = range.createContextualFragment(sanitizePastedHtml(html));
        } else {
            // plain text — `\n` renders natively under white-space: pre-wrap.
            frag = document.createDocumentFragment();
            frag.appendChild(document.createTextNode(cd.getData('text/plain')));
        }
        const lastNode = frag.lastChild;
        range.insertNode(frag);
        if (lastNode) { range.setStartAfter(lastNode); }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        emit();
    };
    const heightRule = `${rows * 1.5}em`;

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onInput={emit}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={`usm-editor ${className}`}
                style={{
                    paddingRight: 38,
                    minHeight: heightRule,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    ...(expanded
                        ? { overflow: 'auto' }
                        : { maxHeight: heightRule, overflow: 'auto' }),
                    ...(style || {}),
                }}
                {...rest}
            />
            <button
                type="button"
                onClick={() => setExpanded(p => !p)}
                title={expanded ? 'Collapse' : 'Expand'}
                style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 26, height: 26, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, border: '1px solid #E5E7EB',
                    background: 'rgba(255,255,255,0.92)', color: '#6B7280',
                    cursor: 'pointer', transition: 'all 0.15s', zIndex: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.color = '#6B7280'; }}
            >
                <i className={`fa-solid ${expanded ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: 11 }}></i>
            </button>
        </div>
    );
};

export default CollapsibleTextarea;
