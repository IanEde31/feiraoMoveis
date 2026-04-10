-- Índice único parcial para evitar clientes duplicados com mesmo telefone por organização.
-- WHERE telefone IS NOT NULL garante que clientes sem telefone não sejam afetados.
CREATE UNIQUE INDEX IF NOT EXISTS clientes_org_telefone_unique
  ON clientes(organization_id, telefone)
  WHERE telefone IS NOT NULL;
