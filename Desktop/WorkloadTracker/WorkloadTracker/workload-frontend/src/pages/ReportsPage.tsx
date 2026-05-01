import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getThisWeekWorkload, getNextWeekWorkload, getAllTasks } from '../api/tasks';
import { WorkloadMember, TaskItem } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ReportsPage = () => {
  const [thisWeek, setThisWeek] = useState<WorkloadMember[]>([]);
  const [nextWeek, setNextWeek] = useState<WorkloadMember[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    getThisWeekWorkload().then(setThisWeek);
    getNextWeekWorkload().then(setNextWeek);
    getAllTasks().then(setTasks);
  }, []);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.status === 3).length;
  const inProgressTasks = tasks.filter((t: any) => t.status === 1).length;
  const blockedTasks = tasks.filter((t: any) => t.status === 2).length;
  const newTasks = tasks.filter((t: any) => t.status === 0).length;
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: 'Done', value: doneTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { name: 'Blocked', value: blockedTasks, color: '#ef4444' },
    { name: 'New', value: newTasks, color: '#8888aa' },
  ].filter(d => d.value > 0);

  const overdueTasks = tasks.filter((t: any) =>
    new Date(t.dueDate) < new Date() && t.status !== 3
  );

  const weekComparisonData = thisWeek.map(member => {
    const nextWeekMember = nextWeek.find(m => m.userId === member.userId);
    return {
      name: member.fullName.split(' ')[0],
      'This Week': Number(member.totalWeight.toFixed(1)),
      'Next Week': Number((nextWeekMember?.totalWeight || 0).toFixed(1)),
    };
  });

  const workloadData = thisWeek.map(m => ({
    name: m.fullName.split(' ')[0],
    Weight: Number(m.totalWeight.toFixed(1)),
    fill: m.status === 'Available' ? '#10b981' : m.status === 'Moderate' ? '#f59e0b' : '#ef4444'
  }));

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1.5px solid #e8e8f0',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(99,102,241,0.1)',
    color: '#1a1a2e',
  };

  // ===== Export PDF =====
  const exportReportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 16, 8, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('W', 17.5, 19);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('WorkloadTracker', 32, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Reports & Analytics', 32, 21);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | By: ${user?.fullName}`,
      32, 28
    );

    // Task Summary
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Task Summary', 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [['Metric', 'Value']],
      body: [
        ['Total Tasks', totalTasks.toString()],
        ['Completed', `${doneTasks} (${completionRate}%)`],
        ['In Progress', inProgressTasks.toString()],
        ['Blocked', blockedTasks.toString()],
        ['New', newTasks.toString()],
        ['Overdue', overdueTasks.length.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 50 } },
      margin: { left: 14 },
      tableWidth: 120,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const label = data.cell.raw as string;
          if (label === 'Completed') data.cell.styles.textColor = [5, 150, 105];
          else if (label === 'Blocked' || label === 'Overdue') data.cell.styles.textColor = [220, 38, 38];
          else if (label === 'In Progress') data.cell.styles.textColor = [217, 119, 6];
        }
      },
    });

    // Team Workload
    const y1 = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Team Workload This Week', 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['#', 'Member', 'Tasks', 'Effort (hrs)', 'Weight', 'Status']],
      body: thisWeek.map((m, i) => [
        (i + 1).toString(),
        m.fullName,
        m.totalTasks.toString(),
        m.totalEffort.toString(),
        m.totalWeight.toFixed(1),
        m.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const s = data.cell.raw as string;
          if (s === 'Available') data.cell.styles.textColor = [5, 150, 105];
          else if (s === 'Moderate') data.cell.styles.textColor = [217, 119, 6];
          else if (s === 'Overloaded') data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    // Week Comparison
    if (weekComparisonData.length > 0) {
      let y2 = (doc as any).lastAutoTable.finalY + 12;
      if (y2 > 240) { doc.addPage(); y2 = 20; }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('This Week vs Next Week', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Member', 'This Week', 'Next Week', 'Change']],
        body: weekComparisonData.map(m => {
          const change = m['Next Week'] - m['This Week'];
          return [
            m.name,
            m['This Week'].toFixed(1),
            m['Next Week'].toFixed(1),
            change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1),
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const val = parseFloat(data.cell.raw as string);
            if (val > 0) data.cell.styles.textColor = [220, 38, 38];
            else if (val < 0) data.cell.styles.textColor = [5, 150, 105];
          }
        },
      });
    }

    // Overdue Tasks
    if (overdueTasks.length > 0) {
      let y3 = (doc as any).lastAutoTable.finalY + 12;
      if (y3 > 240) { doc.addPage(); y3 = 20; }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(`Overdue Tasks (${overdueTasks.length})`, 14, y3);
      doc.setTextColor(30, 30, 30);

      autoTable(doc, {
        startY: y3 + 4,
        head: [['#', 'Task', 'Assigned To', 'Due Date', 'Weight']],
        body: overdueTasks.map((t: any, i) => [
          (i + 1).toString(),
          t.title,
          t.assignedUser,
          new Date(t.dueDate).toLocaleDateString(),
          t.weight?.toFixed(1) || '0',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 170);
      doc.setFont('helvetica', 'normal');
      doc.text('WorkloadTracker — Confidential Report', 14, 291);
      doc.text(`Page ${i} of ${pageCount}`, 196, 291, { align: 'right' });
    }

    doc.save(`WorkloadTracker_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>

        {/* Header + Export Button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 },
          mb: { xs: 2, sm: 3 },
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              📊 Reports & Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Team performance overview
            </Typography>
          </Box>

          {/* زر PDF — Admin فقط */}
          {user?.role === 'Admin' && (
            <Button
              variant="contained"
              onClick={exportReportPDF}
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                fontWeight: 700,
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                fontSize: { xs: '0.82rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                },
              }}
            >
              📄 Export PDF
            </Button>
          )}
        </Box>

        {/* Stats Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
        }}>
          {[
            { label: 'Total Tasks', value: totalTasks, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: '📋' },
            { label: 'Completed', value: doneTasks, color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: '✅' },
            { label: 'In Progress', value: inProgressTasks, color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '⚡' },
            { label: 'Overdue', value: overdueTasks.length, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '⚠️' },
          ].map((stat, i) => (
            <Box key={stat.label} sx={{
              background: stat.bg,
              border: `1.5px solid ${stat.border}`,
              borderRadius: '16px',
              p: { xs: 1.5, sm: 2.5 },
              animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
              '@keyframes fadeUp': {
                from: { opacity: 0, transform: 'translateY(16px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}>
              <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.6rem' }, mb: 0.5 }}>{stat.icon}</Typography>
              <Typography variant="h4" fontWeight={900} sx={{
                color: stat.color,
                fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' },
                lineHeight: 1,
              }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{
                color: stat.color, fontWeight: 700,
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Completion Rate */}
        <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={700} sx={{
              color: '#4a4a6a', minWidth: { xs: 100, sm: 130 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}>
              Completion Rate
            </Typography>
            <Box sx={{
              flex: 1, minWidth: 100,
              background: 'rgba(99,102,241,0.08)',
              borderRadius: '10px', height: { xs: 8, sm: 12 }, overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${completionRate}%`,
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                height: '100%', borderRadius: '10px',
                transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 8px rgba(99,102,241,0.4)',
              }} />
            </Box>
            <Typography variant="h6" fontWeight={900} sx={{
              color: '#6366f1', minWidth: 48,
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }}>
              {completionRate}%
            </Typography>
          </Box>
        </Paper>

        {/* Charts Row */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
          gap: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
        }}>
          {/* Workload Bar Chart */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              ⚖️ Workload This Week
            </Typography>
            {workloadData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>No data available</Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workloadData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f0" />
                    <XAxis dataKey="name" stroke="#8888aa" fontSize={11} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#8888aa" fontSize={11} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="Weight" radius={[8, 8, 0, 0]}>
                      {workloadData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mt: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { color: '#10b981', label: 'Available' },
                    { color: '#f59e0b', label: 'Moderate' },
                    { color: '#ef4444', label: 'Overloaded' },
                  ].map(l => (
                    <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: '#8888aa', fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                        {l.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Pie Chart */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              📊 Status Distribution
            </Typography>
            {statusData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>No tasks available</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%"
                    innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={8} formatter={(value: string) => (
                    <span style={{ color: '#4a4a6a', fontSize: '11px', fontWeight: 600 }}>{value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>

        {/* Week Comparison */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            📅 This Week vs Next Week
          </Typography>
          {weekComparisonData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>No data available</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weekComparisonData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f0" />
                <XAxis dataKey="name" stroke="#8888aa" fontSize={11} tick={{ fontSize: 11 }} />
                <YAxis stroke="#8888aa" fontSize={11} tick={{ fontSize: 11 }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconSize={8} formatter={(value: string) => (
                  <span style={{ color: '#4a4a6a', fontSize: '11px', fontWeight: 600 }}>{value}</span>
                )} />
                <Line type="monotone" dataKey="This Week" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Next Week" stroke="#ec4899" strokeWidth={2.5}
                  dot={{ fill: '#ec4899', r: 4, strokeWidth: 0 }}
                  strokeDasharray="6 4" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{
              color: '#dc2626', fontSize: { xs: '0.95rem', sm: '1.1rem' }
            }}>
              ⚠️ Overdue Tasks ({overdueTasks.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {overdueTasks.map((task: any) => (
                <Box key={task.id} sx={{
                  p: { xs: 1.5, sm: 2 },
                  background: 'rgba(239,68,68,0.04)',
                  border: '1.5px solid rgba(239,68,68,0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 },
                }}>
                  <Box>
                    <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8888aa' }}>
                      Assigned to: {task.assignedUser}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
                    <Box sx={{
                      px: 1.5, py: 0.5,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px',
                    }}>
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '0.72rem' }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{
                      px: 1.5, py: 0.5,
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: '8px',
                    }}>
                      <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, fontSize: '0.72rem' }}>
                        ⚖️ {task.weight?.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default ReportsPage;