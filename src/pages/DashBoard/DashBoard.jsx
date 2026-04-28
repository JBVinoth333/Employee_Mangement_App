import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../config';
import ThemeToggle from '../../components/ThemeToggle';
import AddDepartmentForm from './components/AddDepartmentForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import AddJobForm from './components/AddJobForm';
import AddJobPostingForm from './components/AddJobPostingForm';
import DepartmentTable from './components/DepartmentTable';
import EmployeeTable from './components/EmployeeTable';
import JobTable from './components/JobTable';
import JobPostingTable from './components/JobPostingTable';
import JobApplicationsModal from './components/JobApplicationsModal';
import EmployeeModal from './components/EmployeeModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import EditDepartmentModal from './components/EditDepartmentModal';
import EditJobModal from './components/EditJobModal';
import EmployeeFilters from './components/EmployeeFilters';
import './DashBoard.css';

const API = `${BASE_URL}/api`;

function DashBoard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('departments');

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [visibleEmployees, setVisibleEmployees] = useState([]);
  const [deptManagers, setDeptManagers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);

  const [showAddPosting, setShowAddPosting] = useState(false);
  const [viewingPostingApps, setViewingPostingApps] = useState(null);

  
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState('all');
  const [employeeDepartment, setEmployeeDepartment] = useState('all');
  const [employeeSortBy, setEmployeeSortBy] = useState('name');
  const [employeeSortOrder, setEmployeeSortOrder] = useState('asc');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState('');

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [editingEmp, setEditingEmp] = useState(null);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);

  const [editingDept, setEditingDept] = useState(null);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);

  const [editingJob, setEditingJob] = useState(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);

  function loadEmployeeList(searchValue = employeeSearch, statusValue = employeeStatus, departmentValue = employeeDepartment, sortByValue = employeeSortBy, sortOrderValue = employeeSortOrder) {
    const params = new URLSearchParams();

    if (searchValue.trim()) {
      params.set('search', searchValue.trim());
    }
    if (statusValue !== 'all') {
      params.set('status', statusValue);
    }
    if (departmentValue !== 'all') {
      params.set('departmentId', departmentValue);
    }
    params.set('sortBy', sortByValue);
    params.set('sortOrder', sortOrderValue);

    const query = params.toString();
    setEmployeeLoading(true);
    setEmployeeError('');

    fetch(API + '/employees' + (query ? '?' + query : ''), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load employees');
        }
        return res.json();
      })
      .then((data) => setVisibleEmployees(data))
      .catch(() => {
        setVisibleEmployees([]);
        setEmployeeError('Failed to load employee list');
      })
      .finally(() => setEmployeeLoading(false));
  }

  function loadData() {
    fetch(API + '/departments', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch(() => {});

    fetch(API + '/employees', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch(() => {});

    fetch(API + '/jobs', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch(() => {});

    fetch(API + '/deptManager', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setDeptManagers(data))
      .catch(() => {});

    fetch(API + '/jobpostings', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setJobPostings(Array.isArray(data) ? data : []))
      .catch(() => {});

    loadEmployeeList();
  }

  function handleLogout() {
    fetch(API + '/logout', { method: 'POST', credentials: 'include' })
      .then(() => navigate('/login'))
      .catch(() => navigate('/login'));
  }

  function viewEmployee(id) {
    fetch(API + '/employee?id=' + id, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setSelectedEmp(data);
        setShowModal(true);
      })
      .catch(() => {});
  }

  function deleteEmployee(id) {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    fetch(API + '/employee?id=' + id, { method: 'DELETE', credentials: 'include' })
      .then((res) => res.json())
      .then(() => {
        loadData();
        if (showModal) setShowModal(false);
      })
      .catch(() => {});
  }

  function addDepartment(data) {
    fetch(API + '/addDepartment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => loadData())
      .catch(() => {});
  }

  function assignManager(deptId, managerId) {
    fetch(API + '/deptManager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ departmentId: deptId, managerId }),
    })
      .then((res) => res.json())
      .then(() => loadData())
      .catch(() => {});
  }

  function removeManager(deptId) {
    if (!window.confirm('Remove manager from this department?')) return;
    fetch(API + '/deptManager?departmentId=' + deptId, { method: 'DELETE', credentials: 'include' })
      .then((res) => res.json())
      .then(() => loadData())
      .catch(() => {});
  }

  function openEditEmployee(emp) {
    setEditingEmp({ ...emp });
    setShowEditEmpModal(true);
  }

  function updateEmployee(data) {
    fetch(API + '/updateEmployee', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        setShowEditEmpModal(false);
        setEditingEmp(null);
        setShowModal(false);
        loadData();
      })
      .catch(() => {});
  }

  function updateDepartment(data) {
    fetch(API + '/updateDepartment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        setShowEditDeptModal(false);
        setEditingDept(null);
        loadData();
      })
      .catch(() => {});
  }

  function updateJob(data) {
    fetch(API + '/updateJob', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        setShowEditJobModal(false);
        setEditingJob(null);
        loadData();
      })
      .catch(() => {});
  }

  function addJob(data) {
    fetch(API + '/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        loadData();
        setShowAddJob(false);
      })
      .catch(() => {});
  }

  function addJobPosting(data) {
    fetch(API + '/jobpostings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        fetch(API + '/jobpostings', { credentials: 'include' })
          .then((res) => res.json())
          .then((d) => setJobPostings(Array.isArray(d) ? d : []))
          .catch(() => {});
        setShowAddPosting(false);
      })
      .catch(() => {});
  }

  function openEditJob(job) {
    setEditingJob({ ...job });
    setShowEditJobModal(true);
  }

  function addEmployee(data) {
    fetch(API + '/addEmployee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        loadData();
        setShowAddEmp(false);
      })
      .catch(() => {});
  }

  function checkUpdateAvailability() {
    fetch(API + '/isupdateAvailable', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 200) {
          setUpdateAvailable(true);
          return;
        }

        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }

        setUpdateAvailable(payload?.status === 200);
      })
      .catch(() => {
        setUpdateAvailable(false);
      });
  }

  function handleApplyUpdate() {
    setUpdatingApp(true);

    fetch(API + '/applyUpdate', {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Request failed.');
        }

        setUpdateAvailable(false);
      })
      .catch(() => {
        setUpdateAvailable(true);
      })
      .finally(() => {
        setUpdatingApp(false);
      });
  }

  function renderUpdateActionButton() {
    if (updateAvailable) {
      return (
        <button className="update-app-btn" onClick={handleApplyUpdate} disabled={updatingApp}>
          {updatingApp ? 'Updating...' : 'Update App'}
        </button>
      );
    }

    return null;
  }

  useEffect(() => {
    fetch(API + '/departments', { credentials: 'include' })
      .then((res) => res.json())
      .then((departmentsData) => setDepartments(departmentsData))
      .catch(() => {});

    setEmployeeLoading(true);
    setEmployeeError('');
    fetch(API + '/employees', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load employees');
        }
        return res.json();
      })
      .then((employeesData) => {
        setEmployees(employeesData);
        setVisibleEmployees(employeesData);
      })
      .catch(() => {
        setEmployees([]);
        setVisibleEmployees([]);
        setEmployeeError('Failed to load employee list');
      })
      .finally(() => setEmployeeLoading(false));

    fetch(API + '/jobs', { credentials: 'include' })
      .then((res) => res.json())
      .then((jobsData) => setJobs(jobsData))
      .catch(() => {});

    fetch(API + '/deptManager', { credentials: 'include' })
      .then((res) => res.json())
      .then((managerData) => setDeptManagers(managerData))
      .catch(() => {});

    fetch(API + '/jobpostings', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setJobPostings(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    checkUpdateAvailability();

    const intervalId = window.setInterval(() => {
      checkUpdateAvailability();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const activeEmployees = employees.filter((employee) => employee.status === 'Active').length;
  const inactiveEmployees = employees.filter((employee) => employee.status === 'Inactive').length;
  const terminatedEmployees = employees.filter((employee) => employee.status === 'Terminated').length;
  const shouldShowUpdatePanel = updateAvailable;

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="dashboard-header-actions">
            <button className="attendance-nav-btn" onClick={() => navigate('/attendance')}>
              View Attendance
            </button>
          </div>
        </div>

      {shouldShowUpdatePanel && (
        <div className="update-flow-panel">
          <div className="update-flow-actions">
            {renderUpdateActionButton()}
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button className={tab === 'departments' ? 'tab active' : 'tab'} onClick={() => setTab('departments')}>
          Departments
        </button>
        <button className={tab === 'employees' ? 'tab active' : 'tab'} onClick={() => setTab('employees')}>
          Employees
        </button>
        <button className={tab === 'jobs' ? 'tab active' : 'tab'} onClick={() => setTab('jobs')}>
          Jobs
        </button>
        <button className={tab === 'postings' ? 'tab active' : 'tab'} onClick={() => setTab('postings')}>
          Job Postings
        </button>
      </div>

      {tab === 'departments' && (
        <div className="tab-content">
          <button className="toggle-form-btn" onClick={() => setShowAddDept(!showAddDept)}>
            {showAddDept ? '− Cancel' : '+ Add Department'}
          </button>
          {showAddDept && <AddDepartmentForm onAdd={addDepartment} />}
          <h3>Current Departments</h3>
          <DepartmentTable
            departments={departments}
            employees={employees}
            deptManagers={deptManagers}
            onEdit={(dept) => { setEditingDept({ ...dept }); setShowEditDeptModal(true); }}
            onAssignManager={assignManager}
            onRemoveManager={removeManager}
          />
        </div>
      )}

      {tab === 'employees' && (
        <div className="tab-content">
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Total Employees</span>
              <strong>{employees.length}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Active</span>
              <strong>{activeEmployees}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Inactive</span>
              <strong>{inactiveEmployees}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Terminated</span>
              <strong>{terminatedEmployees}</strong>
            </div>
          </div>

          <button className="toggle-form-btn" onClick={() => setShowAddEmp(!showAddEmp)}>
            {showAddEmp ? '− Cancel' : '+ Add Employee'}
          </button>
          {showAddEmp && <AddEmployeeForm departments={departments} jobs={jobs} onAdd={addEmployee} />}

          <EmployeeFilters
            search={employeeSearch}
            status={employeeStatus}
            department={employeeDepartment}
            sortBy={employeeSortBy}
            sortOrder={employeeSortOrder}
            departments={departments}
            onChange={({ search, status, department, sortBy, sortOrder }) => {
              setEmployeeSearch(search);
              setEmployeeStatus(status);
              setEmployeeDepartment(department);
              setEmployeeSortBy(sortBy);
              setEmployeeSortOrder(sortOrder);
              loadEmployeeList(search, status, department, sortBy, sortOrder);
            }}
          />

          <h3>Employee List</h3>
          {employeeError && <p className="table-message error">{employeeError}</p>}
          {employeeLoading && <p className="table-message">Loading employees...</p>}
          <EmployeeTable
            employees={visibleEmployees}
            departments={departments}
            jobs={jobs}
            onView={viewEmployee}
            onEdit={openEditEmployee}
            onDelete={deleteEmployee}
          />
        </div>
      )}

      {showModal && selectedEmp && (
        <EmployeeModal
          employee={selectedEmp}
          departments={departments}
          jobs={jobs}
          onClose={() => setShowModal(false)}
          onEdit={openEditEmployee}
          onDelete={deleteEmployee}
        />
      )}

      {showEditEmpModal && editingEmp && (
        <EditEmployeeModal
          employee={editingEmp}
          departments={departments}
          jobs={jobs}
          onClose={() => setShowEditEmpModal(false)}
          onSave={updateEmployee}
        />
      )}

      {showEditDeptModal && editingDept && (
        <EditDepartmentModal
          department={editingDept}
          onClose={() => setShowEditDeptModal(false)}
          onSave={updateDepartment}
        />
      )}

      {tab === 'jobs' && (
        <div className="tab-content">
          <button className="toggle-form-btn" onClick={() => setShowAddJob(!showAddJob)}>
            {showAddJob ? '− Cancel' : '+ Add Job'}
          </button>
          {showAddJob && <AddJobForm onAdd={addJob} />}
          <h3>Current Jobs</h3>
          <JobTable
            jobs={jobs}
            onEdit={openEditJob}
          />
        </div>
      )}

      {showEditJobModal && editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setShowEditJobModal(false)}
          onSave={updateJob}
        />
      )}

      {tab === 'postings' && (
        <div className="tab-content">
          <button className="toggle-form-btn" onClick={() => setShowAddPosting(!showAddPosting)}>
            {showAddPosting ? '− Cancel' : '+ Create Job Posting'}
          </button>
          {showAddPosting && (
            <AddJobPostingForm jobs={jobs} departments={departments} onAdd={addJobPosting} />
          )}
          <h3>Job Postings</h3>
          <JobPostingTable
            postings={jobPostings}
            jobs={jobs}
            departments={departments}
            onViewApplications={(posting) => setViewingPostingApps(posting)}
          />
        </div>
      )}

      {viewingPostingApps && (
        <JobApplicationsModal
          posting={viewingPostingApps}
          jobs={jobs}
          departments={departments}
          onClose={() => setViewingPostingApps(null)}
          onApplicationUpdated={loadData}
        />
      )}

      <button className="logout-btn logout-btn-bottom" onClick={handleLogout}>Logout</button>
      <div className="theme-toggle-bottom">
        <ThemeToggle />
      </div>
      </div>
    </>
  );
}

export default DashBoard;
