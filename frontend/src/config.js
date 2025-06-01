// Configuration for API endpoints
const config = {
  // Local development API URL
  localApiUrl: 'http://localhost:5000/api',
  
  // When using ngrok, replace this with your ngrok backend URL
  // Example: 'https://abcd-123-456-789.ngrok.io/api'
  ngrokApiUrl: '',
  
  // Set to true when using ngrok, false when using local development
  useNgrok: false,
  
  // The API URL to use based on the useNgrok setting
  get apiUrl() {
    return this.useNgrok && this.ngrokApiUrl ? this.ngrokApiUrl : this.localApiUrl;
  }
};
  
export default config;
