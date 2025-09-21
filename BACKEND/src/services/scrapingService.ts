import puppeteer, { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';
import axios from 'axios';
import { logger } from '../utils/logger';
import { supabaseService } from '../config/supabase';
import { ProcessActivity, ActivityType } from '../types';

interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  newActivities?: ProcessActivity[];
}

class JudicialScrapingService {
  private browser: Browser | null = null;
  private readonly maxConcurrentPages = 3;
  private readonly requestDelay = parseInt(process.env.SCRAPING_DELAY_MS || '2000');

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });
      
      logger.info('Puppeteer browser initialized');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeRamaJudicial(processNumber: string): Promise<ScrapingResult> {
    let page: Page | null = null;
    
    try {
      await this.initialize();
      page = await this.browser!.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to Rama Judicial consultation page
      const url = process.env.RAMA_JUDICIAL_URL || 'https://consultaprocesos.ramajudicial.gov.co';
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Fill in the process number
      await page.waitForSelector('#numeroRadicacion');
      await page.type('#numeroRadicacion', processNumber);
      
      // Submit the form
      await page.click('#btnConsultar');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Wait for results to load
      await this.delay(this.requestDelay);
      
      // Check if process was found
      const content = await page.content();
      const $ = cheerio.load(content);
      
      if ($('.error-message').length > 0 || $('.no-results').length > 0) {
        return {
          success: false,
          error: 'Process not found in Rama Judicial'
        };
      }
      
      // Extract process information
      const processData = {
        processNumber,
        courtName: $('.court-name').text().trim() || 'Unknown Court',
        processType: $('.process-type').text().trim() || 'Unknown Type',
        subjectMatter: $('.subject-matter').text().trim() || '',
        plaintiff: $('.plaintiff').text().trim() || '',
        defendant: $('.defendant').text().trim() || '',
        status: this.normalizeStatus($('.status').text().trim()),
        lastUpdate: this.parseDate($('.last-update').text().trim())
      };
      
      // Extract activities
      const activities: ProcessActivity[] = [];
      $('.activity-item').each((index, element) => {
        const activityEl = $(element);
        const activity: Partial<ProcessActivity> = {
          activity_type: this.determineActivityType(activityEl.find('.activity-type').text()),
          title: activityEl.find('.activity-title').text().trim(),
          description: activityEl.find('.activity-description').text().trim(),
          activity_date: this.parseDate(activityEl.find('.activity-date').text().trim()),
          is_new: true
        };
        
        if (activity.title && activity.activity_date) {
          activities.push(activity as ProcessActivity);
        }
      });
      
      // Extract documents
      const documents: any[] = [];
      $('.document-item').each((index, element) => {
        const docEl = $(element);
        const document = {
          document_name: docEl.find('.doc-name').text().trim(),
          document_type: docEl.find('.doc-type').text().trim(),
          file_url: docEl.find('.doc-link').attr('href') || '',
          file_size: 0
        };
        
        if (document.document_name) {
          documents.push(document);
        }
      });
      
      await page.close();
      
      return {
        success: true,
        data: {
          process: processData,
          activities,
          documents
        },
        newActivities: activities
      };
      
    } catch (error: any) {
      logger.error('Rama Judicial scraping error:', error);
      
      if (page) {
        await page.close();
      }
      
      return {
        success: false,
        error: error.message || 'Unknown scraping error'
      };
    }
  }

  async scrapeConsejoEstado(processNumber: string): Promise<ScrapingResult> {
    let page: Page | null = null;
    
    try {
      await this.initialize();
      page = await this.browser!.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const url = process.env.CONSEJO_ESTADO_URL || 'https://www.consejodeestado.gov.co';
      await page.goto(`${url}/consulta-procesos`, { waitUntil: 'networkidle2' });
      
      // Similar implementation for Consejo de Estado
      // This would depend on the actual structure of their consultation system
      
      await this.delay(this.requestDelay);
      await page.close();
      
      return {
        success: true,
        data: {
          process: { processNumber },
          activities: [],
          documents: []
        }
      };
      
    } catch (error: any) {
      logger.error('Consejo Estado scraping error:', error);
      
      if (page) {
        await page.close();
      }
      
      return {
        success: false,
        error: error.message || 'Unknown scraping error'
      };
    }
  }

  // Generic method that tries multiple portals
  async scrapeProcess(processNumber: string, portalName?: string): Promise<ScrapingResult> {
    try {
      // Update scraping job status to running
      const job = await supabaseService.insert('scraping_jobs', {
        process_id: await this.getProcessIdByNumber(processNumber),
        status: 'running',
        portal_name: portalName || 'auto',
        started_at: new Date()
      });

      let result: ScrapingResult;

      if (portalName === 'rama-judicial' || !portalName) {
        result = await this.scrapeRamaJudicial(processNumber);
        
        if (result.success || portalName === 'rama-judicial') {
          await this.updateScrapingJob(job.id, result.success ? 'completed' : 'failed', result.error);
          return result;
        }
      }

      if (portalName === 'consejo-estado' || !portalName) {
        result = await this.scrapeConsejoEstado(processNumber);
        await this.updateScrapingJob(job.id, result.success ? 'completed' : 'failed', result.error);
        return result;
      }

      // If no portal worked
      await this.updateScrapingJob(job.id, 'failed', 'No portal available for this process');
      return {
        success: false,
        error: 'Process not found in any available portal'
      };

    } catch (error: any) {
      logger.error('General scraping error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'activo': 'active',
      'inactivo': 'inactive',
      'terminado': 'closed',
      'archivado': 'archived'
    };
    
    return statusMap[status.toLowerCase()] || 'active';
  }

  private determineActivityType(typeText: string): ActivityType {
    const text = typeText.toLowerCase();
    
    if (text.includes('audiencia') || text.includes('hearing')) return ActivityType.HEARING;
    if (text.includes('auto') || text.includes('sentencia') || text.includes('resolution')) return ActivityType.RESOLUTION;
    if (text.includes('notificación') || text.includes('notification')) return ActivityType.NOTIFICATION;
    if (text.includes('documento') || text.includes('document')) return ActivityType.DOCUMENT;
    if (text.includes('apelación') || text.includes('appeal')) return ActivityType.APPEAL;
    
    return ActivityType.OTHER;
  }

  private parseDate(dateStr: string): Date {
    try {
      // Try different date formats common in Colombian judicial system
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        /(\d{1,2})-(\d{1,2})-(\d{4})/    // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === formats[1]) {
            // YYYY-MM-DD format
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            // DD/MM/YYYY or DD-MM-YYYY format
            return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }
        }
      }

      // Fallback to Date constructor
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  }

  private async getProcessIdByNumber(processNumber: string): Promise<string | null> {
    try {
      const processes = await supabaseService.select('judicial_processes', {
        filters: { process_number: processNumber }
      });
      
      return processes && processes.length > 0 ? processes[0].id : null;
    } catch (error) {
      logger.error('Error getting process ID:', error);
      return null;
    }
  }

  private async updateScrapingJob(jobId: string, status: string, errorMessage?: string) {
    try {
      await supabaseService.update('scraping_jobs', jobId, {
        status,
        completed_at: new Date(),
        error_message: errorMessage || null,
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error updating scraping job:', error);
    }
  }
}

export const judicialScrapingService = new JudicialScrapingService();
export default judicialScrapingService;