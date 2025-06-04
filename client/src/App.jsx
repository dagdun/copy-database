import { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Progress } from 'antd';
import axios from 'axios';

const { Option } = Select;
const server = 'http://127.0.0.1:3001';

const ConnectionManager = ({ onUpdate }) => {
  const [connections, setConnections] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    const res = await axios.get(`${server}/connections`);
    setConnections(res.data);
    onUpdate && onUpdate(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const add = async () => {
    const values = await form.validateFields();
    await axios.post(`${server}/connections`, values);
    form.resetFields();
    fetchData();
  };

  const remove = async (id) => {
    await axios.delete(`${server}/connections/${id}`);
    fetchData();
  };

  return (
    <div>
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="name" rules={[{ required: true }]}> 
          <Input placeholder="name" />
        </Form.Item>
        <Form.Item name="type" rules={[{ required: true }]}> 
          <Select style={{ width: 120 }}>
            <Option value="mongo">MongoDB</Option>
            <Option value="mysql">MySQL</Option>
          </Select>
        </Form.Item>
        <Form.Item name="url" rules={[{ required: true }]}> 
          <Input placeholder="connection url" />
        </Form.Item>
        <Form.Item name="database"> 
          <Input placeholder="database" />
        </Form.Item>
        <Button type="primary" onClick={add}>Add</Button>
      </Form>
      <Table
        dataSource={connections}
        rowKey="id"
        pagination={false}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Action', render: (_, r) => <Button danger onClick={() => remove(r.id)}>Remove</Button> }
        ]}
      />
    </div>
  );
};

const DumpManager = () => {
  const [connections, setConnections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [progress, setProgress] = useState(0);
  const [dumpId, setDumpId] = useState(null);

  const updateConnections = (list) => setConnections(list);

  const fetchCollections = async (id) => {
    const res = await axios.get(`${server}/collections`, { params: { connectionId: id } });
    setCollections(res.data);
  };

  const startDump = async (values) => {
    const res = await axios.post(`${server}/dump`, values);
    setDumpId(res.data.dumpId);
  };

  useEffect(() => {
    if (!dumpId) return;
    const timer = setInterval(async () => {
      const res = await axios.get(`${server}/progress/${dumpId}`);
      setProgress(res.data.percent);
      if (res.data.status === 'completed') clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [dumpId]);

  return (
    <div>
      <ConnectionManager onUpdate={updateConnections} />
      <Form onFinish={startDump} layout="inline" style={{ marginTop: 24 }}>
        <Form.Item name="fromId" label="From" rules={[{ required: true }]}> 
          <Select style={{ width: 150 }} onChange={fetchCollections}>
            {connections.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="toId" label="To" rules={[{ required: true }]}> 
          <Select style={{ width: 150 }}>
            {connections.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="collection" label="Collection"> 
          <Select style={{ width: 150 }} allowClear>
            {collections.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="limit" label="Limit"> 
          <Input style={{ width: 100 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit">Start Dump</Button>
      </Form>
      {dumpId && <Progress percent={progress} style={{ marginTop: 16 }} />}
    </div>
  );
};

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <DumpManager />
    </div>
  );
}
