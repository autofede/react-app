import { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button } from '@mui/material';
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

interface RespondentDetail {
  response_id: string;
  user_name: string;
  survey_id: number;
  survey_title: string;
  submit_time: string;
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
  const [productQualityData, setProductQualityData] = useState<{ data: ChartData<'pie'>, total: number } | null>(null);
  const [roleSatisfactionData, setRoleSatisfactionData] = useState<{ data: ChartData<'pie'>, total: number } | null>(null);
  const [ageDistributionData, setAgeDistributionData] = useState<ChartData<'bar'> | null>(null);
  const [respondentsData, setRespondentsData] = useState<RespondentData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [respondentDetails, setRespondentDetails] = useState<RespondentDetail[]>([]);
  const [selectedRow, setSelectedRow] = useState<RespondentDetail | null>(null);

  const createChartData = (apiData: ApiResponse, colorSet: string[]): { data: ChartData<'pie'>, total: number } => {
    const sortedData = [...apiData.data].sort((a, b) => 
      parseFloat(a.rating) - parseFloat(b.rating)
    );
    
    const total = sortedData.reduce((sum, item) => sum + item.count, 0);
    
    return {
      data: {
        labels: sortedData.map(item => 
          `Rating ${parseFloat(item.rating).toFixed(1)} (${((item.count / total) * 100).toFixed(1)}%)`
        ),
        datasets: [{
          data: sortedData.map(item => item.count),
          backgroundColor: colorSet,
          borderColor: colorSet.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      total
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
      // 获取所有数据
      const [productRes, roleRes, ageRes, respondentsRes] = await Promise.all([
        axios.get<ApiResponse>(`${API_BASE_URL}/api/satisfaction/product-quality`),
        axios.get<ApiResponse>(`${API_BASE_URL}/api/satisfaction/role`),
        axios.get<AgeDistributionResponse>(`${API_BASE_URL}/api/age-distribution`),
        axios.get<RespondentsResponse>(`${API_BASE_URL}/api/respondents?page=${page + 1}&pageSize=${rowsPerPage}`)
      ]);

      // 检查所有请求是否成功
      if (productRes.data.success && roleRes.data.success && ageRes.data.success && respondentsRes.data.success) {
        // 创建图表数据并更新状态
        const productData = createChartData(productRes.data, chartColors.blue);
        const roleData = createChartData(roleRes.data, chartColors.green);
        const ageData = createAgeDistributionData(ageRes.data);

        // 更新所有状态
        setProductQualityData(productData);
        setRoleSatisfactionData(roleData);
        setAgeDistributionData(ageData);
        setRespondentsData(respondentsRes.data.data.respondents);
        setTotalCount(respondentsRes.data.data.pagination.totalCount);

        // 强制重新渲染图表
        ChartJS.getChart('product-quality-chart')?.update();
        ChartJS.getChart('role-satisfaction-chart')?.update();
        ChartJS.getChart('age-distribution-chart')?.update();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    fetchRespondentDetails();
  }, [page, rowsPerPage]);

  const fetchRespondentDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/respondents?page=${page + 1}&pageSize=${rowsPerPage}`);
      if (response.data.success) {
        // 将后端返回的数据格式转换为我们需要的格式
        const formattedData = response.data.data.respondents.map((item: any) => ({
          response_id: item.respondent_id.toString(),
          user_name: item.user_name.toString(),
          survey_id: 1, // 如果后端没有提供，使用默认值
          survey_title: 'Survey', // 如果后端没有提供，使用默认值
          submit_time: new Date(item.created_at).toLocaleString()
        }));
        setRespondentDetails(formattedData);
        setTotalCount(response.data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error('Error fetching respondent details:', error);
    }
  };

  const handleRowClick = (row: RespondentDetail) => {
    setSelectedRow(selectedRow?.response_id === row.response_id ? null : row);
  };

  const handleDelete = async () => {
    if (!selectedRow) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/responses`, {
        data: {
          response_id: selectedRow.response_id,
          user_name: selectedRow.user_name
        }
      });

      if (response.data.success) {
        // 刷新所有数据
        fetchData();  // 重新获取所有图表数据
        setPage(0);  // 重置到第一页
        fetchRespondentDetails();  // 刷新表格数据
        // 清除选中状态
        setSelectedRow(null);
      }
    } catch (error) {
      console.error('Error deleting response:', error);
    }
  };

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
            Product Quality Satisfaction (Total: {productQualityData?.total || 0})
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {productQualityData && (
              <Pie 
                id="product-quality-chart"
                data={productQualityData.data} 
                options={pieChartOptions} 
              />
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Role Satisfaction (Total: {roleSatisfactionData?.total || 0})
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {roleSatisfactionData && (
              <Pie 
                id="role-satisfaction-chart"
                data={roleSatisfactionData.data} 
                options={pieChartOptions} 
              />
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
            <Bar 
              id="age-distribution-chart"
              data={ageDistributionData} 
              options={barChartOptions} 
            />
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
          {selectedRow && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
            >
              Delete Selected
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Response ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Survey ID</TableCell>
                <TableCell>Survey Title</TableCell>
                <TableCell>Submit Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {respondentDetails.map((row) => (
                <TableRow
                  key={row.response_id}
                  hover
                  onClick={() => handleRowClick(row)}
                  selected={selectedRow?.response_id === row.response_id}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{row.response_id}</TableCell>
                  <TableCell>{row.user_name}</TableCell>
                  <TableCell>{row.survey_id}</TableCell>
                  <TableCell>{row.survey_title}</TableCell>
                  <TableCell>{row.submit_time}</TableCell>
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