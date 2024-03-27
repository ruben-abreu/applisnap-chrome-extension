document.addEventListener('DOMContentLoaded', async function () {
  const baseURL = `http://localhost:5005`;

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: email,
        password: password,
      });

      const { userId, authToken } = response.data;

      chrome.storage.local.set({ userId: userId, authToken: authToken }, () => {
        populateBoardsDropdown(userId);

        const loginContainer = document.getElementById('login-form');
        const welcomeContainer = document.getElementById('welcome-container');
        const loginMessage = document.getElementById('loginMessage');
        loginContainer.style.display = 'none';
        welcomeContainer.style.display = 'block';
        loginMessage.style.display = 'none';

        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.textContent = ``;
      });
    } catch (error) {
      console.error('Login error:', error);
      displayErrorMessage('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['userId', 'authToken'], () => {
      const loginContainer = document.getElementById('login-form');
      const welcomeContainer = document.getElementById('welcome-container');
      const addJobForm = document.getElementById('addJobForm');
      const loginMessage = document.getElementById('loginMessage');

      loginContainer.style.display = 'block';
      welcomeContainer.style.display = 'none';

      if (addJobForm) {
        addJobForm.style.display = 'none';
        loginMessage.style.display = 'block';
      }
    });
  };

  const fetchBoards = async userId => {
    const authToken = await getAuthToken();
    try {
      const response = await axios.get(
        `${baseURL}/api/boards?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching boards:', error);
      return [];
    }
  };

  const populateBoardsDropdown = async userId => {
    const boardSelect = document.getElementById('board');
    if (!boardSelect) return;

    const boards = await fetchBoards(userId);
    if (!boards || boards.length === 0) {
      console.log('No boards found for this user.');
      return;
    }

    boardSelect.innerHTML = '';

    boards.forEach(board => {
      const option = document.createElement('option');
      option.value = board._id;
      option.text = board.boardName;
      boardSelect.appendChild(option);
    });

    boardSelect.addEventListener('change', async () => {
      const selectedBoardId = boardSelect.value;
      await populateListsDropdown(userId, selectedBoardId);
    });

    const defaultBoardId = boards[0]._id;
    await populateListsDropdown(userId, defaultBoardId);
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
  };

  const fetchLists = async userId => {
    const authToken = await getAuthToken();
    try {
      const response = await axios.get(
        `${baseURL}/api/lists?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lists:', error);
      return [];
    }
  };

  const populateListsDropdown = async (userId, boardId) => {
    const listSelect = document.getElementById('list');
    if (!listSelect) {
      console.error('List select element not found.');
      return;
    }

    listSelect.innerHTML = '';

    const lists = await fetchLists(userId);
    if (!lists || lists.length === 0) {
      console.log('No lists found for this user.');
      return;
    }

    const filteredLists = lists.filter(
      list => list.boardId.toString() === boardId
    );

    if (!filteredLists || filteredLists.length === 0) {
      console.log('No lists found for this board.');
      return;
    }

    filteredLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list._id;
      option.text = list.listName;
      listSelect.appendChild(option);
    });
  };

  const addJob = async jobData => {
    const authToken = await getAuthToken();
    try {
      const response = await axios.post(`${baseURL}/api/jobs`, jobData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  };

  const getAuthToken = async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('authToken', result => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        const authToken = result.authToken;
        resolve(authToken);
      });
    });
  };

  const displayErrorMessage = message => {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  };

  const displaySuccessMessage = message => {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }
  };

  chrome.storage.local.get('jobFormData', function (data) {
    const formData = data.jobFormData;
    if (formData) {
      document.getElementById('companyName').value = formData.companyName || '';
      document.getElementById('roleName').value = formData.roleName || '';
      document.getElementById('domain').value = formData.domain || '';
      document.getElementById('jobURL').value = formData.jobURL || '';
      document.getElementById('jobDescription').value =
        formData.jobDescription || '';
      document.getElementById('workLocation').value =
        formData.workLocation || '';
      document.getElementById('workModel').value = formData.workModel || '';
      document.getElementById('notes').value = formData.notes || '';
      document.getElementById('list').value = formData.listId || '';
      document.getElementById('board').value = formData.boardId || '';
      document.getElementById('starred').checked = formData.starred || false;

      const userId = formData.userId;
      if (userId) {
        populateBoardsDropdown(userId);
      }
    }
  });

  const inputFields = document.querySelectorAll('input, textarea, select');
  inputFields.forEach(input => {
    input.addEventListener('change', function () {
      const formData = {
        companyName: document.getElementById('companyName').value,
        roleName: document.getElementById('roleName').value,
        domain: document.getElementById('domain').value,
        jobURL: document.getElementById('jobURL').value,
        jobDescription: document.getElementById('jobDescription').value,
        workLocation: document.getElementById('workLocation').value,
        workModel: document.getElementById('workModel').value,
        notes: document.getElementById('notes').value,
        listId: document.getElementById('list').value,
        boardId: document.getElementById('board').value,
        starred: document.getElementById('starred').checked,
        userId: null,
      };

      chrome.storage.local.set({ jobFormData: formData }, function () {});
    });
  });

  const showAddJobForm = () => {
    const addJobForm = document.getElementById('addJobForm');
    if (addJobForm) {
      addJobForm.style.display = 'block';
    }
  };

  chrome.storage.local.get(['userId', 'authToken'], async function (data) {
    const { userId, authToken } = data;
    if (userId && authToken) {
      populateBoardsDropdown(userId);

      const loginContainer = document.getElementById('login-form');
      const welcomeContainer = document.getElementById('welcome-container');
      const loginMessage = document.getElementById('loginMessage');
      loginContainer.style.display = 'none';
      welcomeContainer.style.display = 'block';
      loginMessage.style.display = 'none';
      const welcomeMessage = document.getElementById('welcome-message');
      welcomeMessage.textContent = ``;

      showAddJobForm();
    }
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await handleLogin(email, password);

      showAddJobForm();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  const addJobForm = document.getElementById('addJobForm');
  if (addJobForm) {
    addJobForm.addEventListener('submit', async event => {
      event.preventDefault();
      const companyName = document.getElementById('companyName').value;
      const roleName = document.getElementById('roleName').value;
      const domain = document.getElementById('domain').value;
      const jobURL = document.getElementById('jobURL').value;
      const jobDescription = document.getElementById('jobDescription').value;
      const workLocation = document.getElementById('workLocation').value;
      const workModel = document.getElementById('workModel').value;
      const notes = document.getElementById('notes').value;
      const listId = document.getElementById('list').value;
      const boardId = document.getElementById('board').value;
      const date = new Date().toISOString();
      const starred = document.getElementById('starred').checked;

      const jobData = {
        companyName,
        roleName,
        domain,
        jobURL,
        jobDescription,
        workLocation,
        workModel,
        notes,
        listId,
        boardId,
        date: {
          created: date,
          applied: null,
          interviews: [],
          offer: null,
          rejected: null,
        },
        starred,
        userId: null,
      };

      chrome.storage.local.get('userId', async result => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          displayErrorMessage('Error getting User ID.');
          return;
        }
        const userId = result.userId;
        jobData.userId = userId;

        try {
          const response = await addJob(jobData);
          console.log('Job added successfully:', response);

          addJobForm.reset();

          chrome.storage.local.remove('jobFormData', function () {
            displaySuccessMessage('Job application added successfully!');
            setTimeout(() => {
              const successDiv = document.getElementById('success-message');
              if (successDiv) {
                successDiv.textContent = '';
                successDiv.style.display = 'none';
              }
            }, 3000);
          });
        } catch (error) {
          console.error('Error adding job:', error);
          displayErrorMessage('Error adding job.');
        }
      });
    });
  }
});
