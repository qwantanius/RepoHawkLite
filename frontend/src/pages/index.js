import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../components/seo';
import Modal from 'react-modal';

const RepositoryList = ({ repositories, openYmlModal }) => {
  return (
    <div className="repository-list">
      {repositories.map((repo, index) => (
        <div key={index} className="repo-card">
          <h2>{repo.reponame}</h2>
          <p>Owner: {repo.owner}</p>
          <p>Size: {repo.size}</p>
          <p>Private: {repo.isPrivate ? 'Yes' : 'No'}</p>
          <p>Total Files: {repo.totalFiles}</p>
          <h3>Branches:</h3>
          {repo.branches.map((branch, branchIndex) => (
            <div key={branchIndex} className="branch">
              <h4>{branch.branchName}</h4>
              <p>Total Amount of Files: {branch.totalAmountOfFiles}</p>
              <p>Total Size: {branch.totalSize}</p>
              <p>Amount of YAML Files: {branch.amountOfYmlFiles}</p>
              <h5>YAML Files:</h5>
              {branch.ymlFiles.map((file, fileIndex) => (
                <div key={fileIndex} className="yml-file" onClick={() => openYmlModal(file)}>
                  <p>Name: {file.ymlFileName}</p>
                  <p>Path: {file.ymlFileRelativePath}</p>
                </div>
              ))}
            </div>
          ))}
          <h3>Webhooks:</h3>
          {repo.webhooks.map((webhook, webhookIndex) => (
            <div key={webhookIndex} className="webhook">
              <p>ID: {webhook.id}</p>
              <p>Name: {webhook.name}</p>
              <p>Active: {webhook.active ? 'Yes' : 'No'}</p>
              <p>URL: {webhook.config.url}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const IndexPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [apiToken, setApiToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentYmlFile, setCurrentYmlFile] = useState(null);

  const fetchRepositories = async (token, pageNum = 1) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            query {
              repository(apiToken: "${token}") {
                reponame
                size
                owner
                isPrivate
                totalFiles
                branches {
                  branchName
                  totalAmountOfFiles
                  totalSize
                  amountOfYmlFiles
                  ymlFiles {
                    ymlFileName
                    ymlFileRelativePath
                    ymlFileContent
                  }
                }
                webhooks {
                  id
                  name
                  active
                  config {
                    url
                  }
                }
              }
            }
          `
        })
      });
      const result = await response.json();
      if (response.ok && result.data) {
        if (pageNum === 1) {
          setRepositories(result.data.repository);
        } else {
          setRepositories(prevRepos => [...prevRepos, ...result.data.repository]);
        }
      } else {
        console.error('Error fetching repositories:', result.errors);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loading) {
      return;
    }
    setPage(prevPage => prevPage + 1);
  }, [loading]);

  useEffect(() => {
    if (apiToken) {
      fetchRepositories(apiToken, page);
    }
  }, [page, apiToken]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleReload = () => {
    setPage(1);
    fetchRepositories(apiToken, 1);
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    setApiToken(inputToken);
    setPage(1);
    fetchRepositories(inputToken, 1);
  };

  const openYmlModal = (file) => {
    setCurrentYmlFile(file);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentYmlFile(null);
  };

  return (
    <div className="neon-theme">
      <SEO title="Repository Info" />
      <form onSubmit={handleTokenSubmit} className="token-form">
        <input
          type="text"
          placeholder="Enter GitHub API Token"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
      <button onClick={handleReload}>Reload</button>
      <RepositoryList repositories={repositories} openYmlModal={openYmlModal} />
      {loading && <p>Loading...</p>}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="YAML File Content" className="modal">
        {currentYmlFile && (
          <div>
            <h2>{currentYmlFile.ymlFileName}</h2>
            <pre>{currentYmlFile.ymlFileContent}</pre>
            <button onClick={closeModal}>Close</button>
          </div>
        )}
      </Modal>
      <style jsx>{`
        .neon-theme {
          background-color: #0f0f0f;
          color: #0f0;
          font-family: 'Courier New', Courier, monospace;
          padding: 20px;
        }
        .token-form {
          margin-bottom: 20px;
        }
        .repository-list {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .repo-card {
          background: #1a1a1a;
          border: 1px solid #0f0;
          border-radius: 8px;
          padding: 16px;
          width: 300px;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0, 255, 0, 0.2);
        }
        .repo-card h2 {
          font-size: 1.5em;
          margin-top: 0;
          color: #0f0;
        }
        .repo-card p {
          font-size: 0.875em;
          margin: 0.25em 0;
          color: #0f0;
        }
        .repo-card h3 {
          font-size: 1.25em;
          margin-top: 1em;
          color: #0f0;
        }
        .repo-card .branch,
        .repo-card .webhook {
          margin-top: 1em;
          padding-left: 1em;
          border-left: 2px solid #0f0;
        }
        .repo-card .branch h4 {
          font-size: 1em;
          margin: 0.5em 0;
          color: #0f0;
        }
        .repo-card .branch h5 {
          font-size: 0.875em;
          margin: 0.5em 0;
          color: #0f0;
        }
        .repo-card .branch p,
        .repo-card .branch .yml-file p,
        .repo-card .branch .yml-file pre {
          font-size: 0.75em;
          margin: 0.25em 0;
          color: #0f0;
        }
        .repo-card .branch .yml-file {
          cursor: pointer;
        }
        .repo-card .branch .yml-file:hover {
          text-decoration: underline;
        }
        .modal {
          background: #1a1a1a;
          border: 1px solid #0f0;
          border-radius: 8px;
          padding: 16px;
          width: 80%;
          margin: auto;
          color: #0f0;
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
