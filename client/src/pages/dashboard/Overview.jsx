import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart } from 'recharts';
import { adminApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { ErrorState, PageLoader } from '../../components/ui/Bits.jsx';
import { DashHeader } from '../../layouts/DashboardLayout.jsx';
import { compactNumber } from '../../utils/format.js';

const AXIS = { stroke: '#6b6b6b', fontSize: 11, tickLine: false, axisLine: false };
const TOOLTIP = {
  contentStyle: { background: '#121212', border: '1px solid #3d3d3d', borderRadius: 0, fontSize: 12 },
  labelStyle: { color: '#f2eee6', fontWeight: 600 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

function Card({ label, value, accent, hint }) {
  return (
    <div className={`border p-5 ${accent ? 'border-blood bg-blood/10' : 'border-ink-600 bg-ink-900'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-300">{label}</p>
      <p className={`mt-2 font-display text-4xl font-bold tabular-nums ${accent ? 'text-blood-400' : 'text-white'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`min-w-0 border border-ink-600 bg-ink-900 p-5 ${className}`}>
      <h2 className="kicker mb-5 text-ink-300">{title}</h2>
      {children}
    </section>
  );
}

export default function Overview() {
  const { data, loading, error, reload } = useAsync(() => adminApi.analytics(), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const c = data.cards;
  const top = data.topArticles.map((a) => ({
    name: a.title.length > 28 ? `${a.title.slice(0, 26)}…` : a.title,
    Views: a.viewCount,
    Likes: a.likeCount,
    Comments: a.commentCount,
  }));

  return (
    <>
      <DashHeader
        title="Overview"
        subtitle={data.scope === 'own' ? 'Figures for your own articles.' : 'Figures across the whole publication.'}
        actions={<Link to="/dashboard/articles/new" className="btn-red btn-sm">New article</Link>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Card label="Total articles" value={c.totalArticles} hint={`${c.drafts} drafts · ${c.scheduled} scheduled`} />
        <Card label="Published" value={c.published} />
        <Card label="Total views" value={compactNumber(c.views)} accent />
        <Card label="Comments" value={compactNumber(c.comments)} hint={c.reportedComments != null ? `${c.reportedComments} reported` : undefined} />
        {c.users != null ? (
          <Card label="Users" value={compactNumber(c.users)} hint={`${c.subscribers} newsletter subscribers`} />
        ) : (
          <Card label="Likes" value={compactNumber(c.likes)} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Likes" value={compactNumber(c.likes)} hint={`${c.likesLast30Days} in the last 30 days`} />
        <Card label="Bookmarks" value={compactNumber(c.bookmarks)} />
        <Card label="Polls" value={c.polls} />
        <Card label="Avg. views / article" value={c.published ? compactNumber(Math.round(c.views / c.published)) : '—'} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Engagement — top articles">
          {top.length === 0 ? (
            <p className="text-sm text-ink-400">No published articles yet.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={top} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="#262626" horizontal={false} />
                  <XAxis type="number" {...AXIS} />
                  <YAxis type="category" dataKey="name" width={150} {...AXIS} />
                  <Tooltip {...TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Views" fill="#b5121b" />
                  <Bar dataKey="Likes" fill="#f2eee6" />
                  <Bar dataKey="Comments" fill="#6b6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Publishing & views — last 6 months">
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart data={data.monthly}>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="month" {...AXIS} />
                <YAxis yAxisId="l" {...AXIS} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" {...AXIS} />
                <Tooltip {...TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="published" name="Articles published" fill="#3d3d3d" />
                <Line yAxisId="r" dataKey="views" name="Views (by publish month)" stroke="#d61f2a" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="By category" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="py-2 font-semibold">Category</th>
                  <th className="py-2 text-right font-semibold">Articles</th>
                  <th className="py-2 text-right font-semibold">Views</th>
                  <th className="py-2 text-right font-semibold">Likes</th>
                  <th className="w-1/3 py-2 pl-6 font-semibold">Share of views</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((r) => {
                  const pct = c.views ? Math.round((r.views / c.views) * 100) : 0;
                  return (
                    <tr key={r.name} className="border-t border-ink-700">
                      <td className="py-2.5 font-medium text-white">{r.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{r.articles}</td>
                      <td className="py-2.5 text-right tabular-nums">{r.views.toLocaleString()}</td>
                      <td className="py-2.5 text-right tabular-nums">{r.likes}</td>
                      <td className="py-2.5 pl-6">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-ink-700"><div className="h-full bg-blood" style={{ width: `${pct}%` }} /></div>
                          <span className="w-9 text-right text-xs tabular-nums text-ink-300">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
