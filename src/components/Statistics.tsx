import { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartData,
} from 'chart.js';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

// 注册所需的 Chart.js 组件
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://127.0.0.1:5000';

interface ApiResponse {
  success: boolean;
  data: Array<{
    rating: string;
    count: number;
  }>;
}

interface AgeDistributionResponse {
  success: boolean;
  data: {
    distribution: Array<{
      ageGroup: string;
      count: number;
    }>;
    totalRespondents: number;
  };
}

interface RespondentData {
  respondent_id: number;
  user_name: number;
  email: string;
  ip_address: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface RespondentsResponse {
  success: boolean;
  data: {
    pagination: PaginationInfo;
    respondents: RespondentData[];
  };
}

const chartColors = {
  blue: [
    'rgba(66, 165, 245, 0.8)',   // #42a5f5
    'rgba(100, 181, 246, 0.8)',  // #64b5f6
    'rgba(144, 202, 249, 0.8)',  // #90caf9
    'rgba(187, 222, 251, 0.8)',  // #bbdefb
    'rgba(227, 242, 253, 0.8)',  // #e3f2fd
  ],
  green: [
    'rgba(102, 187, 106, 0.8)',  // #66bb6a
    'rgba(129, 199, 132, 0.8)',  // #81c784
    'rgba(165, 214, 167, 0.8)',  // #a5d6a7
    'rgba(200, 230, 201, 0.8)',  // #c8e6c9
    'rgba(232, 245, 233, 0.8)',  // #e8f5e9
  ]
};

export default function Statistics() {
  const [productQualityData, setProductQualityData] = useState<ChartData<'pie'> | null>(null);
  const [roleSatisfactionData, setRoleSatisfactionData] = useState<ChartData<'pie'> | null>(null);
  const [ageDistributionData, setAgeDistributionData] = useState<ChartData<'bar'> | null>(null);
  const [respondentsData, setRespondentsData] = useState<RespondentData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);

  const createChartData = (apiData: ApiResponse, colorSet: string[]): ChartData<'pie'> => {
    const sortedData = [...apiData.data].sort((a, b) => 
      parseFloat(a.rating) - parseFloat(b.rating)
    );
    
    const total = sortedData.reduce((sum, item) => sum + item.count, 0);
    
    return {
      labels: sortedData.map(item => 
        `Rating ${parseFloat(item.rating).toFixed(1)} (${((item.count / total) * 100).toFixed(1)}%)`
      ),
      datasets: [{
        data: sortedData.map(item => item.count),
        backgroundColor: colorSet,
        borderColor: colorSet.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    };
  };

  const createAgeDistributionData = (apiData: AgeDistributionResponse): ChartData<'bar'> => {
    const sortedData = [...apiData.data.distribution].sort((a, b) => {
      const aAge = parseInt(a.ageGroup.split('-')[0]);
      const bAge = parseInt(b.ageGroup.split('-')[0]);
      return aAge - bAge;
    });

    return {
      labels: sortedData.map(item => item.ageGroup),
      datasets: [{
        label: `Number of Respondents (Total: ${apiData.data.totalRespondents})`,
        data: sortedData.map(item => item.count),
        backgroundColor: 'rgba(66, 165, 245, 0.8)',
        borderColor: 'rgba(66, 165, 245, 1)',
        borderWidth: 1
      }]
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, roleRes, ageRes, respondentsRes] = await Promise.all([
        axios.get<ApiResponse>(`${API_BASE_URL}/api/satisfaction/product-quality`),
        axios.get<ApiResponse>(`${API_BASE_URL}/api/satisfaction/role`),
        axios.get<AgeDistributionResponse>(`${API_BASE_URL}/api/age-distribution`),
        axios.get<RespondentsResponse>(`${API_BASE_URL}/api/respondents?page=${page + 1}&pageSize=${rowsPerPage}`)
      ]);

      if (productRes.data.success && roleRes.data.success && ageRes.data.success && respondentsRes.data.success) {
        setProductQualityData(createChartData(productRes.data, chartColors.blue));
        setRoleSatisfactionData(createChartData(roleRes.data, chartColors.green));
        setAgeDistributionData(createAgeDistributionData(ageRes.data));
        setRespondentsData(respondentsRes.data.data.respondents);
        setTotalCount(respondentsRes.data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} responses (${percentage}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Age Distribution by 10-Year Intervals',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Respondents'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Age Group (Years)'
        }
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Respondent Statistics</Typography>
        <IconButton onClick={fetchData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3,
        mb: 3
      }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Product Quality Satisfaction
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {productQualityData && (
              <Pie data={productQualityData} options={pieChartOptions} />
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Role Satisfaction
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {roleSatisfactionData && (
              <Pie data={roleSatisfactionData} options={pieChartOptions} />
            )}
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribution of respondents by age group (10-year intervals)
        </Typography>
        <Box sx={{ height: 400, position: 'relative' }}>
          {ageDistributionData && (
            <Bar data={ageDistributionData} options={barChartOptions} />
          )}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">
            Respondent Details
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Showing page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Respondent ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {respondentsData.map((row) => (
                <TableRow key={row.respondent_id}>
                  <TableCell>{row.respondent_id}</TableCell>
                  <TableCell>{row.user_name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.ip_address}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(row.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
} 