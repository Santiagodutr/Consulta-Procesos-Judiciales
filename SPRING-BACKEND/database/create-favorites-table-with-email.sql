-- Drop existing table if needed (CUIDADO: esto borrará todos los favoritos guardados)
DROP TABLE IF EXISTS public.favorite_processes;

-- Create favorite_processes table usando email en lugar de UUID
CREATE TABLE public.favorite_processes (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    numero_radicacion VARCHAR(100) NOT NULL,
    despacho VARCHAR(500),
    demandante TEXT,
    demandado TEXT,
    tipo_proceso VARCHAR(500),
    fecha_radicacion VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_user_email_process UNIQUE (user_email, numero_radicacion)
);

-- Create index for faster queries
CREATE INDEX idx_favorite_processes_user_email ON public.favorite_processes(user_email);
CREATE INDEX idx_favorite_processes_numero_radicacion ON public.favorite_processes(numero_radicacion);

-- Enable Row Level Security
ALTER TABLE public.favorite_processes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own favorites (using email from JWT)
CREATE POLICY "Users can view own favorites" 
ON public.favorite_processes FOR SELECT 
USING (auth.jwt() ->> 'email' = user_email);

-- Policy: Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites" 
ON public.favorite_processes FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites" 
ON public.favorite_processes FOR DELETE 
USING (auth.jwt() ->> 'email' = user_email);

-- Grant permissions
GRANT ALL ON public.favorite_processes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE favorite_processes_id_seq TO authenticated;
