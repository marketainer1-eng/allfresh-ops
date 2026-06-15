-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "input_mode" TEXT,
    "product_info" TEXT,
    "source_url" TEXT,
    "file_name" TEXT,
    "attributes" JSONB,
    "target_customer" TEXT,
    "marketing_copy" TEXT,
    "seo_keywords" JSONB,
    "seasonal_campaign" TEXT,
    "hashtags" JSONB,
    "price_positioning" TEXT,
    "differentiation" TEXT,
    "recommended_channels" JSONB,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "assignee" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_plans" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "key_points" JSONB,
    "hashtags" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_tasks" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "content_plan_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "recommended_date" TIMESTAMP(3) NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "analysis_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "color" TEXT,
    "channel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "analysis_id" TEXT,
    "product_name" TEXT NOT NULL,
    "origin" TEXT,
    "grade" TEXT,
    "sale_price" DOUBLE PRECISION,
    "wholesale_price" DOUBLE PRECISION,
    "discount_rate" DOUBLE PRECISION,
    "avg_temperature" DOUBLE PRECISION,
    "rainfall" DOUBLE PRECISION,
    "is_holiday" BOOLEAN NOT NULL DEFAULT false,
    "day_of_week" TEXT,
    "month" INTEGER,
    "season" TEXT,
    "previous_day_sales" DOUBLE PRECISION,
    "last_week_sales" DOUBLE PRECISION,
    "last_year_sales" DOUBLE PRECISION,
    "model_type" TEXT,
    "predicted_demand" DOUBLE PRECISION,
    "confidence_r2" DOUBLE PRECISION,
    "rmse" DOUBLE PRECISION,
    "mape" DOUBLE PRECISION,
    "feature_importance" JSONB,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kamis_mappings" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "analysis_id" TEXT,
    "product_name" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT,
    "item_code" TEXT NOT NULL,
    "item_name" TEXT,
    "kind_code" TEXT,
    "kind_name" TEXT,
    "rank_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kamis_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analyses_workspace_id_created_at_idx" ON "analyses"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "strategy_items_analysis_id_idx" ON "strategy_items"("analysis_id");

-- CreateIndex
CREATE INDEX "content_plans_analysis_id_idx" ON "content_plans"("analysis_id");

-- CreateIndex
CREATE INDEX "execution_tasks_analysis_id_idx" ON "execution_tasks"("analysis_id");

-- CreateIndex
CREATE INDEX "marketing_campaigns_workspace_id_start_date_idx" ON "marketing_campaigns"("workspace_id", "start_date");

-- CreateIndex
CREATE INDEX "demand_forecasts_workspace_id_created_at_idx" ON "demand_forecasts"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "kamis_mappings_workspace_id_idx" ON "kamis_mappings"("workspace_id");

-- CreateIndex
CREATE INDEX "kamis_mappings_product_name_idx" ON "kamis_mappings"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_workspace_id_category_key" ON "prompt_templates"("workspace_id", "category");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_items" ADD CONSTRAINT "strategy_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_items" ADD CONSTRAINT "strategy_items_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_tasks" ADD CONSTRAINT "execution_tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_tasks" ADD CONSTRAINT "execution_tasks_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_tasks" ADD CONSTRAINT "execution_tasks_content_plan_id_fkey" FOREIGN KEY ("content_plan_id") REFERENCES "content_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kamis_mappings" ADD CONSTRAINT "kamis_mappings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kamis_mappings" ADD CONSTRAINT "kamis_mappings_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

