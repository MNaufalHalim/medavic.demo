// Configuration for API endpoints
const config = {
  // Local development API URL
  localApiUrl: 'http://localhost:5000/api',
  
  // Production API URL (deployed backend)
  productionApiUrl: 'https://medavicdemo-production.up.railway.app/api', // Railway deployed backend URL
  
  // When using ngrok, replace this with your ngrok backend URL
  // Example: 'https://abcd-123-456-789.ngrok.io/api'
  ngrokApiUrl: '',
  
  // Set to true when using ngrok, false when using local development
  useNgrok: false,
  
  // Force production mode to always use the Railway backend
  // Set this to true to always use the production API URL regardless of environment
  forceProduction: true,
  
  // Automatically detect if we're in production mode
  isProduction: import.meta.env.PROD || true,
  
  // The API URL to use based on environment and settings
  get apiUrl() {
    // Always use production API URL if forceProduction is true
    if (this.forceProduction || this.isProduction) {
      return this.productionApiUrl;
    }
    return this.useNgrok && this.ngrokApiUrl ? this.ngrokApiUrl : this.localApiUrl;
  }
};
  
export default config;
