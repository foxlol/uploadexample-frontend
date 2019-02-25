import React, { Component } from "react";
import { uniqueId } from "lodash";
import filesize from "filesize";

import GlobalStyle from "./styles/global";
import { Container, Content } from "./styles";
import Upload from "./components/upload";
import FileList from "./components/file-list";
import api from "./services/api";

class App extends Component {
  state = {
    uploadedFiles: []
  };

  async componentDidMount() {
    const response = await api.get("posts");

    this.setState({
      uploadedFiles: response.data.map(file => ({
        id: file._id,
        name: file.name,
        readableSize: filesize(file.size),
        preview: file.url,
        uploaded: true,
        url: file.url
      }))
    });
  }

  componentWillUnmount() {
    this.state.uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }

  handleUpload = files => {
    const uploadedFiles = files.map(file => ({
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null
    }));

    this.setState({
      uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)
    });

    uploadedFiles.forEach(this.processUpload);
  };

  updateFile = (id, data) => {
    this.setState({
      uploadedFiles: this.state.uploadedFiles.map(file => {
        return id === file.id ? { ...file, ...data } : file;
      })
    });
  };

  processUpload = async file => {
    const data = new FormData();

    data.append("file", file.file, file.name);
    try {
      const response = await api.post("posts", data, {
        onUploadProgress: e => {
          const progress = parseInt(Math.round((e.loaded * 100) / e.total));

          this.updateFile(file.id, {
            progress
          });
        }
      });

      this.updateFile(file.id, {
        uploaded: true,
        id: response.data._id,
        url: response.data.url
      });
    } catch (error) {
      this.updateFile(file.id, {
        error: true
      });
    }
  };

  handleDelete = async id => {
    await api.delete(`posts/${id}`);

    this.setState({
      uploadedFiles: this.state.uploadedFiles.filter(file => file.id !== id)
    });
  };

  render() {
    const { uploadedFiles } = this.state;

    return (
      <Container>
        <GlobalStyle />
        <Content>
          <Upload onUpload={this.handleUpload} />
          {!!uploadedFiles.length && (
            <FileList files={uploadedFiles} onDelete={this.handleDelete} />
          )}
        </Content>
      </Container>
    );
  }
}

export default App;
