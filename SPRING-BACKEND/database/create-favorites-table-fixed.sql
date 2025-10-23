-- Drop existing table if needed (CUIDADO: esto borrará todos los favoritos guardados)
DROP TABLE IF EXISTS public.favorite_processes;

-- Create favorite_processes table usando UUID del usuario
CREATE TABLE public.favorite_processes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    numero_radicacion VARCHAR(100) NOT NULL,
    despacho VARCHAR(500),
    demandante TEXT,
    demandado TEXT,
    tipo_proceso VARCHAR(500),
    fecha_radicacion VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_user_process UNIQUE (user_id, numero_radicacion)
);

-- Create index for faster queries
CREATE INDEX idx_favorite_processes_user_id ON public.favorite_processes(user_id);
CREATE INDEX idx_favorite_processes_numero_radicacion ON public.favorite_processes(numero_radicacion);

-- Enable Row Level Security (DISABLED for now to simplify - backend handles auth)
ALTER TABLE public.favorite_processes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.favorite_processes TO authenticated;
GRANT ALL ON public.favorite_processes TO anon;
GRANT USAGE, SELECT ON SEQUENCE favorite_processes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE favorite_processes_id_seq TO anon;
