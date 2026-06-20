import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUturnLeftIcon,
  BookmarkIcon,
  TrashIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../hooks/useAuth';

interface NewsPost {
  id: number;
  title: string;
  content: string;
  author?: string;
  // backend uses snake_case created_at, allow both
  created_at?: string;
  createdAt?: string;
  likes?: number;
  liked?: boolean;
  comments?: number;
  image?: string;
  // client-side
  commentsList?: any[];
  commentsCount?: number;
  showComments?: boolean;
  attachments?: string[];
}

export const CommunityView: React.FC = () => {
  const { hasRole, token, user } = useAuth();
  const isAdmin = hasRole('Admin');
  const [news, setNews] = useState<NewsPost[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: '',
    category: 'discussion'
  });
  const [loading, setLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [referencedComment, setReferencedComment] = useState<Record<number, any>>({});
  const [commentSort, setCommentSort] = useState<'best' | 'top' | 'new' | 'old'>('best');
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [savedComments, setSavedComments] = useState<Set<number>>(new Set());
  const [commentVotes, setCommentVotes] = useState<Record<number, 'up' | 'down' | null>>({});
  const [userCommentVotes, setUserCommentVotes] = useState<Record<number, 'up' | 'down' | null>>({});
  const [userPostVotes, setUserPostVotes] = useState<Record<number, 'up' | null>>({});
  const [openActionsMenuId, setOpenActionsMenuId] = useState<number | null>(null);

  const fetchPosts = async () => {
    // For initial load we show a loading indicator; subsequent polling should be quiet and only update changed fields.
    const isInitial = news.length === 0;
    if (isInitial) setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/community/posts', { headers });
      if (!res.ok) throw new Error('Failed to fetch posts');
      let data = await res.json();
      // normalize server-side field names so UI always reads the same properties
      data = data.map((r: any) => ({
        ...r,
        likes: r.upvotes ?? r.likes ?? 0,
        upvotes: r.upvotes ?? r.likes ?? 0,
        comments_count: r.comments_count ?? r.comments ?? (r.commentsCount ?? 0),
        commentsCount: r.comments_count ?? r.comments ?? (r.commentsCount ?? 0)
      }));

      // Update user post votes state from server
      const postVotes: Record<number, 'up' | null> = {};
      data.forEach((p: any) => {
        if (p.user_vote) {
          postVotes[p.id] = p.user_vote;
        }
      });
      setUserPostVotes(postVotes);

      // Update state minimally: only change likes/commentsCount (and add new posts) to avoid full list replacement
      setNews(prev => {
        // build a map of remote posts by id (stringified)
        const remoteMap = new Map<string, any>();
        data.forEach((p: any) => remoteMap.set(String(p.id), p));

        // track new posts to prepend
        const newPosts: any[] = [];

        // start from existing order, update in-place where necessary
        const updated = prev.map(p => {
          const r = remoteMap.get(String(p.id));
          if (!r) return p; // unchanged

          // compute remote counts
          const remoteLikes = r.upvotes ?? r.likes ?? p.likes ?? 0;
          const remoteCommentsCount = r.comments_count ?? r.comments ?? (p.commentsCount ?? 0);

          // only update if relevant fields changed
          if (remoteLikes !== (p.likes || 0) || remoteCommentsCount !== (p.commentsCount || 0) || r.title !== p.title || r.content !== p.content) {
            return {
              ...p,
              title: r.title ?? p.title,
              content: r.content ?? p.content,
              likes: remoteLikes,
              upvotes: remoteLikes,
              commentsCount: remoteCommentsCount,
              comments_count: remoteCommentsCount,
              // keep existing commentsList & showComments to avoid closing
              commentsList: p.commentsList || [],
              showComments: p.showComments || false,
              attachments: r.attachments || p.attachments
            };
          }
          return p;
        });

        // find remote posts that are not in prev; prepend them
        data.forEach((r: any) => {
          const exists = prev.some(p => String(p.id) === String(r.id));
          if (!exists) {
            newPosts.push({
              ...r,
              likes: r.upvotes ?? r.likes ?? 0,
              upvotes: r.upvotes ?? r.likes ?? 0,
              liked: false,
              commentsList: [],
              commentsCount: r.comments_count ?? (r.comments ? r.comments.length : 0) ?? 0,
              comments_count: r.comments_count ?? (r.comments ? r.comments.length : 0) ?? 0,
              showComments: false
            });
          }
        });

        if (newPosts.length === 0) {
          // if nothing changed (object identity), return prev to avoid re-render
          return updated;
        }

        return [...newPosts, ...updated];
      });
    } catch (err) {
      console.error('Error loading community posts', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };
  

  // Component to render children with curved connectors and a stopping behavior for the last child
  const ThreadConnector: React.FC<{
    top: number;
    height: number;
    strokeWidth?: number;
  }> = ({ top, height, strokeWidth = 1.3 }) => {
    // width + x coordinates chosen so curve bends left from parent to child avatars
    const width = 40;
    // coordinates: start at x = width - 4, end at x = 4
    const x1 = width - 4;
    const x2 = 4;
    // control points half-way horizontally to create a smooth cubic bezier
    const cp1x = Math.round((x1 + x2) / 2);
    const cp2x = cp1x;

    // path will be drawn from (x1, y1) to (x2, y2) where y1 is 10px from top of svg and y2 is svg height - 10
    const y1 = 10;
    const y2 = height - 10;

    const d = `M ${x1} ${y1} C ${cp1x} ${y1} ${cp2x} ${y2} ${x2} ${y2}`;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute left-[-36px] pointer-events-none"
        style={{ top }}
      >
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          className="text-gray-300 dark:text-gray-600"
          opacity={0.9}
        />
      </svg>
    );
  };


  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) throw new Error('Not authenticated');
      const payload = {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        attachments: newPost.image ? [newPost.image] : []
      };
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create post');
      }
      const created = await res.json();
      setNews(prev => [{
        ...created,
        likes: created.upvotes || 0,
        liked: false,
        commentsList: [],
        commentsCount: 0,
        showComments: false
      }, ...prev]);
      setShowCreateForm(false);
      setNewPost({ title: '', content: '', image: '', category: 'discussion' });
    } catch (err) {
      console.error('Create post error', err);
      alert('Failed to create post');
    }
  };

  const CommentInput: React.FC<{ 
    onSubmit: (text: string) => void;
    referencedComment?: any;
    onClearReference?: () => void;
    onClose?: () => void;
    placeholder?: string;
    mode?: 'reply' | 'quote';
  }> = ({ onSubmit, referencedComment, onClearReference, onClose, placeholder = 'What are your thoughts?', mode = 'quote' }) => {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    
    const handleSubmit = () => {
      if (text.trim()) {
        onSubmit(text.trim());
        setText('');
        if (onClearReference) onClearReference();
      }
    };

    return (
      <div className="space-y-2">
        {/* Quote Mode - Full prominent display */}
        {referencedComment && mode === 'quote' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/30 dark:to-blue-900/10 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  <ArrowUturnLeftIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Quoting</span>
                  <span className="font-bold">{referencedComment.user_name || referencedComment.user?.full_name || referencedComment.user?.username || 'User'}</span>
                </div>
                <div className="bg-white/80 dark:bg-gray-900/50 px-3 py-2 rounded border-l-3 border-blue-400 text-sm text-gray-700 dark:text-gray-300 break-words italic font-medium">
                  &quot;{referencedComment.content}&quot;
                </div>
              </div>
              <button
                onClick={() => {
                  onClearReference?.();
                  onClose?.();
                }}
                type="button"
                className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-1.5 rounded transition-colors flex-shrink-0"
                title="Clear quote"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Reply Mode - Minimal reference only */}
        {referencedComment && mode === 'reply' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
          >
            <ChatBubbleLeftIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
            <span>Replying to <span className="font-semibold text-gray-900 dark:text-gray-100">{referencedComment.user_name || referencedComment.user?.full_name || referencedComment.user?.username || 'User'}</span></span>
            <button
              onClick={() => {
                onClearReference?.();
                onClose?.();
              }}
              type="button"
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
              title="Clear reference"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="space-y-2">
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
            placeholder={placeholder} 
            className={`w-full px-4 py-3 rounded-md border transition-all resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 ${
              isFocused 
                ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900/50' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            rows={isFocused ? 4 : 2}
          />
          {(isFocused || text) && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ctrl+Enter to submit
              </div>
              <div className="flex gap-2">
                {text && (
                  <Button 
                    variant="secondary" 
                    onClick={() => { 
                      setText(''); 
                      onClearReference?.();
                      onClose?.();
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                >
                  Comment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Build a tree of comments (parent -> children) from a flat list
  const buildCommentTree = (flat: any[], sortBy: 'best' | 'top' | 'new' | 'old' = 'best') => {
    if (!flat || flat.length === 0) return [];
    const map = new Map<number, any>();
    const roots: any[] = [];
    flat.forEach(c => {
      map.set(Number(c.id), { ...c, children: [] });
    });
    map.forEach((c) => {
      const parentId = c.parent_id ?? c.parentId ?? null;
      if (parentId && map.has(Number(parentId))) {
        map.get(Number(parentId)).children.push(c);
      } else {
        roots.push(c);
      }
    });
    
    // Sort comments based on selected sorting
    const sortRec = (nodes: any[]) => {
      nodes.sort((a, b) => {
        const aLikes = (a.likes || a.upvotes || 0) - (a.dislikes || a.downvotes || 0);
        const bLikes = (b.likes || b.upvotes || 0) - (b.dislikes || b.downvotes || 0);
        const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
        const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
        
        switch (sortBy) {
          case 'top':
            return bLikes - aLikes;
          case 'new':
            return bTime - aTime;
          case 'old':
            return aTime - bTime;
          case 'best':
          default:
            // Best = combination of likes and recency
            const aScore = aLikes + (Date.now() - aTime) / (1000 * 60 * 60 * 24); // boost recent
            const bScore = bLikes + (Date.now() - bTime) / (1000 * 60 * 60 * 24);
            return bScore - aScore;
        }
      });
      nodes.forEach(n => { if (n.children && n.children.length) sortRec(n.children); });
    };
    sortRec(roots);
    return roots;
  };

  // Recursive comment renderer with Reddit-style features
  const CommentNode: React.FC<{ comment: any; level?: number; postId: number }> = ({
    comment,
    level = 0,
    postId
  }) => {
    const indent = Math.min(level, 6) * 16;
    const isCollapsed = collapsed[comment.id];
    const isReplyOpen = replyOpen[comment.id];
    const quotedComment = referencedComment[comment.id];
    const showActions = openActionsMenuId === comment.id;
    
    const userName = comment.user_name || comment.user?.full_name || comment.user?.username || 'User';
    const userInitial = String(userName || 'U')[0].toUpperCase();
    const commentScore = (comment.likes || comment.upvotes || 0) - (comment.dislikes || comment.downvotes || 0);
    const timeAgo = getTimeAgo(comment.created_at || comment.createdAt);
    const isAuthor = String(comment.user_id) === String(user?.id);
    const hasChildren = comment.children && comment.children.length > 0;

    const handleQuote = () => {
      setReferencedComment(prev => ({ ...prev, [comment.id]: comment }));
      setReplyOpen(prev => ({ ...prev, [comment.id]: true }));
    };

    const handleReply = () => {
      setReplyOpen(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
    };

    const handleCollapse = () => {
      setCollapsed(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
    };

    if (isCollapsed) {
      return (
        <div className="mt-2" style={{ marginLeft: indent }}>
          <button
            onClick={handleCollapse}
            className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ChevronDownIcon className="w-3 h-3" />
            <span className="font-medium">{userName}</span>
            <span className="text-gray-500">({commentScore} points, {hasChildren ? `${comment.children.length} ${comment.children.length === 1 ? 'reply' : 'replies'}` : '0 replies'})</span>
          </button>
        </div>
      );
    }

    return (
      <motion.div 
        className="mt-3 rounded-lg p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md transition-all group" 
        style={{ marginLeft: indent }}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-start gap-3">
          {/* Vote Bar - Reddit Style */}
          <div className="flex flex-col items-center gap-1 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-700 dark:to-transparent rounded-lg p-1.5 h-fit">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => likeComment(comment.id, postId)}
              className={`p-1.5 rounded transition-all ${
                userCommentVotes[comment.id] === 'up' 
                  ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/40 shadow-sm' 
                  : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
              title="Upvote"
            >
              {userCommentVotes[comment.id] === 'up' ? (
                <ArrowUpIconSolid className="w-4 h-4" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              )}
            </motion.button>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[28px] text-center px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 w-8">
              {commentScore}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => downvoteComment(comment.id, postId)}
              className={`p-1.5 rounded transition-all ${
                userCommentVotes[comment.id] === 'down' 
                  ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/40 shadow-sm' 
                  : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
              title="Downvote"
            >
              {userCommentVotes[comment.id] === 'down' ? (
                <ArrowDownIconSolid className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
            </motion.button>
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {userInitial}
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{userName}</span>
                {isAuthor && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500 text-white font-medium">you</span>
                )}
              </div>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{timeAgo}</span>
              {comment.edited && <span className="text-gray-400 italic">(edited)</span>}
            </div>

            {/* Comment Body */}
            <div className="mt-2 text-sm text-gray-900 dark:text-gray-100 break-words">
              {comment.content}
            </div>

            {/* Actions Bar - Reddit Style */}
            <div className="mt-3 flex items-center gap-0 text-xs font-medium text-gray-600 dark:text-gray-400">
              <button
                onClick={handleReply}
                className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                title="Reply to this comment"
              >
                <ChatBubbleLeftIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Reply</span>
              </button>
              
              <button
                onClick={handleQuote}
                className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                title="Quote this comment in your reply"
              >
                <ArrowUturnLeftIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Quote</span>
              </button>
              
              <button
                onClick={() => shareComment(comment.id, postId)}
                className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                title="Copy link to this comment"
              >
                <ShareIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Share</span>
              </button>

              <button
                onClick={() => saveComment(comment.id)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  savedComments.has(comment.id)
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={savedComments.has(comment.id) ? 'Unsave comment' : 'Save comment'}
              >
                {savedComments.has(comment.id) ? (
                  <BookmarkIconSolid className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <BookmarkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="text-xs">Save</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setOpenActionsMenuId(openActionsMenuId === comment.id ? null : comment.id)}
                  className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                  title="More options"
                >
                  <EllipsisHorizontalIcon className="w-4 h-4" />
                </button>
                {showActions && (
                  <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
                    {(isAdmin || isAuthor) && (
                      <button
                        onClick={() => {
                          const newc = prompt('Edit comment', comment.content);
                          if (newc !== null) editComment(comment.id, newc);
                          setOpenActionsMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => {
                          deleteComment(comment.id, postId);
                          setOpenActionsMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        reportComment(comment.id);
                        setOpenActionsMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <FlagIcon className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                )}
              </div>
              
              {hasChildren && (
                <button
                  onClick={handleCollapse}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
                  title="Collapse thread"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                  <span>Collapse</span>
                </button>
              )}
            </div>

            {/* Reply Input */}
            {isReplyOpen && (
              <div className="mt-4 pt-3 pl-4 border-l-2 border-orange-300 dark:border-orange-700">
                <CommentInput
                  onSubmit={(text) => {
                    addComment(postId, text, comment.id);
                    setReplyOpen(prev => ({ ...prev, [comment.id]: false }));
                    setReferencedComment(prev => ({ ...prev, [comment.id]: undefined }));
                  }}
                  referencedComment={quotedComment || comment}
                  onClearReference={() => setReferencedComment(prev => ({ ...prev, [comment.id]: undefined }))}
                  onClose={() => setReplyOpen(prev => ({ ...prev, [comment.id]: false }))}
                  placeholder="Add a reply..."
                  mode={quotedComment ? 'quote' : 'reply'}
                />
              </div>
            )}

            {/* Child Comments */}
            {hasChildren && (
              <div className="mt-3 space-y-2">
                {comment.children.map((child: any) => (
                  <CommentNode key={child.id} comment={child} postId={postId} level={level + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Helper function to get relative time
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };


  const toggleLike = async (postId: number) => {
    try {
      const auth = token;
      const res = await fetch(`/api/community/likes/toggle?post_id=${postId}`, {
        method: 'POST',
        headers: auth ? { Authorization: `Bearer ${auth}` } : undefined
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to toggle like');
      }
      // Get updated counts and user vote status from server
      const json = await res.json().catch(() => null);
      const newUpvotes = json?.upvotes ?? 0;
      const userVote = json?.user_vote ?? null;

      // Update user post votes state
      setUserPostVotes(prev => ({
        ...prev,
        [postId]: userVote
      }));

      // Update post likes count
      setNews(prev => prev.map(p => {
        if (String(p.id) !== String(postId)) return p;
        return { ...p, likes: newUpvotes, upvotes: newUpvotes };
      }));
    } catch (err) {
      console.error('Like error', err);
    }
  };

  const likeComment = async (commentId: number, postId: number) => {
    if (!token) {
      alert('Please login to vote on comments');
      return;
    }

    // Check if user has already voted on this comment
    const userVote = userCommentVotes[commentId] || null;
    
    // Allow only one vote per user - can only toggle or switch vote
    if (userVote === 'up') {
      // If already upvoted, clicking again removes the upvote
      const newVote = null;
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const newUpvotes = json?.upvotes ?? 0;
        const currentDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, newUpvotes, currentDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Vote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: userVote }));
      }
    } else if (userVote === 'down') {
      // If downvoted, switch to upvote
      const newVote = 'up';
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const newUpvotes = json?.upvotes ?? 0;
        const currentDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, newUpvotes, currentDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Vote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: userVote }));
      }
    } else {
      // No vote yet, add upvote
      const newVote = 'up';
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const newUpvotes = json?.upvotes ?? 0;
        const currentDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, newUpvotes, currentDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Vote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: null }));
      }
    }
  };

  const downvoteComment = async (commentId: number, postId: number) => {
    if (!token) {
      alert('Please login to vote on comments');
      return;
    }

    // Check if user has already voted on this comment
    const userVote = userCommentVotes[commentId] || null;
    
    // Allow only one vote per user - can only toggle or switch vote
    if (userVote === 'down') {
      // If already downvoted, clicking again removes the downvote
      const newVote = null;
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/dislike`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const currentUpvotes = json?.upvotes ?? 0;
        const newDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, currentUpvotes, newDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Downvote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: userVote }));
      }
    } else if (userVote === 'up') {
      // If upvoted, switch to downvote
      const newVote = 'down';
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/dislike`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const currentUpvotes = json?.upvotes ?? 0;
        const newDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, currentUpvotes, newDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Downvote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: userVote }));
      }
    } else {
      // No vote yet, add downvote
      const newVote = 'down';
      const updateCommentInTree = (comments: any[], cid: number, upvotes: number, downvotes: number): any[] => {
        return comments.map(c => {
          if (c.id === cid) {
            return { ...c, upvotes, downvotes, likes: upvotes, dislikes: downvotes };
          }
          if (c.children && c.children.length > 0) {
            return { ...c, children: updateCommentInTree(c.children, cid, upvotes, downvotes) };
          }
          return c;
        });
      };

      setUserCommentVotes(prev => ({ ...prev, [commentId]: newVote }));

      try {
        const res = await fetch(`/api/community/comments/${commentId}/dislike`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to vote');
        const json = await res.json();
        const currentUpvotes = json?.upvotes ?? 0;
        const newDownvotes = json?.downvotes ?? 0;
        
        setNews(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsList: updateCommentInTree(p.commentsList || [], commentId, currentUpvotes, newDownvotes)
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Downvote failed', err);
        setUserCommentVotes(prev => ({ ...prev, [commentId]: null }));
      }
    }
  };

  const saveComment = async (commentId: number) => {
    if (!token) {
      alert('Please login to save comments');
      return;
    }
    
    setSavedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
        setShareNotification('Comment unsaved');
      } else {
        newSet.add(commentId);
        setShareNotification('Comment saved!');
      }
      setTimeout(() => setShareNotification(null), 2000);
      return newSet;
    });
  };

  const deleteComment = async (commentId: number, postId: number) => {
    if (!token) {
      alert('Please login to delete comments');
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      setShareNotification('Comment deleted');
      setTimeout(() => setShareNotification(null), 2000);
      await fetchComments(postId);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete comment');
    }
  };

  const reportComment = async (commentId: number) => {
    if (!token) {
      alert('Please login to report comments');
      return;
    }

    const reason = prompt('Report reason (spam, inappropriate, etc):');
    if (!reason) return;

    try {
      const res = await fetch(`/api/community/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setShareNotification('Comment reported. Thank you!');
        setTimeout(() => setShareNotification(null), 2000);
      }
    } catch (err) {
      console.error('Report failed', err);
    }
  };

  const shareComment = async (commentId: number, postId: number) => {
    try {
      const commentUrl = `${window.location.origin}${window.location.pathname}?post=${postId}&comment=${commentId}`;
      await navigator.clipboard.writeText(commentUrl);
      setShareNotification('Link copied to clipboard!');
      setTimeout(() => setShareNotification(null), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
      const commentUrl = `${window.location.origin}${window.location.pathname}?post=${postId}&comment=${commentId}`;
      prompt('Copy this link:', commentUrl);
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      // normalize comment fields - include both upvotes and downvotes
      const normalized = data.map((c: any) => ({ 
        ...c, 
        liked: c.liked || false, 
        upvotes: c.upvotes || 0,
        downvotes: c.downvotes || 0,
        likes: c.upvotes || 0,
        dislikes: c.downvotes || 0
      }));
      setNews(prev => prev.map(p => p.id === postId ? { ...p, commentsList: normalized, commentsCount: normalized.length } : p));
    } catch (err) {
      console.error('Error fetching comments', err);
    }
  };

  const addComment = async (postId: number, content: string, parentId?: number) => {
    try {
      if (!token) {
        alert('Please login to comment');
        return;
      }
      const body: any = { post_id: postId, content };
      if (parentId) body.parent_id = parentId;
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to add comment');
      await res.json();
      // Optimistically bump comments count for the post so UI updates immediately
      setNews(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      // Refresh comments for this post so the new comment appears immediately
      await fetchComments(postId);
      // Clear any referenced comments after successful submission
      if (parentId) {
        setReferencedComment(prev => ({ ...prev, [parentId]: undefined }));
      }
    } catch (err) {
      console.error('Add comment error', err);
      alert('Failed to add comment');
    }
  };

  const editPost = async (postId: number, payload: any) => {
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to edit post');
      const updated = await res.json();
      setNews(prev => prev.map(p => p.id === postId ? { ...p, ...updated } : p));
    } catch (err) {
      console.error('Edit post error', err);
      alert('Failed to edit post');
    }
  };

  const editComment = async (commentId: number, content: string) => {
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to edit comment');
      const updated = await res.json();
      setNews(prev => prev.map(p => ({
        ...p,
        commentsList: (p.commentsList || []).map((c: any) => c.id === commentId ? updated : c)
      })));
    } catch (err) {
      console.error('Edit comment error', err);
      alert('Failed to edit comment');
    }
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      discussion: '💬',
      announcement: '📢',
      question: '❓',
      book_review: '⭐'
    };
    return map[category] || '📝';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Share Notification Toast */}
      {shareNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{shareNotification}</span>
          </div>
        </div>
      )}
      
      {/* Header with r/Libraria branding */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-orange-50 to-white dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">Libraria Community</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Share books, reviews & connect</p>
              </div>
            </motion.div>
            {(isAdmin || user) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Post</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Form Modal */}
        {showCreateForm && (isAdmin || user) && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 shadow-xl">
              <form onSubmit={handleCreatePost} className="p-8 space-y-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">Create a Post</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Share your thoughts with the community</p>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </motion.button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <Input
                    value={newPost.title}
                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                    required
                    placeholder="What's on your mind?"
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={newPost.category}
                    onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-medium hover:border-orange-400 dark:hover:border-orange-600 transition-colors focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="discussion">💬 Discussion</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="question">❓ Question</option>
                    <option value="book_review">⭐ Book Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none dark:bg-gray-800 dark:text-gray-100 transition-all"
                    placeholder="Share your thoughts..."
                    required
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image URL (optional)</label>
                  <Input
                    value={newPost.image}
                    onChange={e => setNewPost({ ...newPost, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-orange-200 dark:border-orange-800">
                  <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Post
                  </motion.button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Posts Feed */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading community posts...</div>
          </div>
        )}

        <div className="space-y-4">
          {news.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No posts yet. Be the first to share!
            </div>
          )}

          {news.map((post: any, idx) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all"
              >
                {/* Gradient background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative flex">
                  {/* Left Sidebar - Vote Buttons */}
                  <div className="flex flex-col items-center justify-start gap-1 w-20 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-800 dark:to-transparent border-r border-gray-200 dark:border-gray-700 py-3 px-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleLike(post.id)}
                      className={`w-full flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-all ${
                        userPostVotes[post.id] === 'up'
                          ? 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-500 shadow-lg'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                      }`}
                      title="Like post"
                    >
                      <HeartIcon className="w-5 h-5" />
                      <span className="text-xs font-bold text-current">
                        {post.likes || 0}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        if (!post.showComments) await fetchComments(post.id);
                        setNews(prev => prev.map(p => p.id === post.id ? { ...p, showComments: !p.showComments } : p));
                      }}
                      className={`w-full flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-all ${
                        post.showComments
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title="View comments"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="text-xs font-bold text-current">
                        {post.commentsCount || 0}
                      </span>
                    </motion.button>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Category Badge */}
                        <motion.div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 border border-orange-200 dark:border-orange-700/50">
                          <span className="text-base">{getCategoryEmoji(post.category || 'discussion')}</span>
                          <span className="text-xs font-bold text-orange-700 dark:text-orange-400 capitalize">{post.category || 'discussion'}</span>
                        </motion.div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{post.title}</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                          Posted {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {isAdmin && (
                        <motion.button
                          whileHover={{ rotate: 90 }}
                          onClick={() => {
                            const title = prompt('Edit title', post.title);
                            const content = prompt('Edit content', post.content);
                            if (title !== null && content !== null) editPost(post.id, { title, content });
                          }}
                          className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
                          title="Edit post"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </div>

                    {/* Images */}
                    {post.attachments?.length > 0 && (
                      <motion.div className="mt-4 rounded-lg overflow-hidden space-y-3">
                        {post.attachments.map((a: string, i: number) => (
                          <motion.img
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            src={a}
                            className="w-full max-h-72 object-cover rounded-lg cursor-pointer transition-transform"
                          />
                        ))}
                      </motion.div>
                    )}                    {/* Comments Section */}
                    {post.showComments && (
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        {/* Header with Count and Sort */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {post.commentsCount || 0} {(post.commentsCount || 0) === 1 ? 'Comment' : 'Comments'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sort by:</span>
                            <select
                              value={commentSort}
                              onChange={(e) => setCommentSort(e.target.value as any)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="best">Best</option>
                              <option value="top">Top</option>
                              <option value="new">New</option>
                              <option value="old">Old</option>
                            </select>
                          </div>
                        </div>

                        {/* Comment Input - Top Level */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <CommentInput 
                            onSubmit={(text) => addComment(post.id, text)} 
                            placeholder="What are your thoughts?"
                          />
                        </div>

                        {/* Comments Tree */}
                        <div className="space-y-1">
                          {buildCommentTree(post.commentsList || [], commentSort).map((root: any) => (
                            <CommentNode key={root.id} comment={root} level={0} postId={post.id} />
                          ))}
                        </div>

                        {(post.commentsList?.length || 0) === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No comments yet. Be the first to share your thoughts!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};